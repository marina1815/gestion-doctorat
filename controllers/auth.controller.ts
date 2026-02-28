// controllers/auth.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/pool";
import { LoginInput } from "../dto/user.dto";
import { findUserById } from "./user.conroller"; // (typo dans le nom du fichier mais je laisse comme toi)
import jwt from "jsonwebtoken";

import {
    createTokenPair,
    verifyRefreshToken,
    DecodedToken,
} from "../service/tokenService";
import {
    accessCookieName,
    refreshCookieName,
    accessCookieOptions,
    refreshCookieOptions,
} from "../config/authConfig";
import {
    hashToken,
    refreshTokenRepo,
} from "../service/refreshTokenStore";

// 🧩 Mapping d'une row brute PostgreSQL vers ton modèle de user
function mapUserRow(row: any) {
    return {
        idUser: row.id_user,
        username: row.username,
        email: row.email,
        isActive: row.is_active,
        idMembre: row.id_membre,
        role: row.role,
        createdAt: row.created_at,
        tokenVersion: row.token_version,
        lastLogin: row.last_login,
    };
}

/* =========================================
   LOGIN
========================================= */
export async function login(req: Request, res: Response) {
    try {
        const { username, password } = req.body as LoginInput;

        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "Username et mot de passe obligatoires" });
        }

        const result = await pool.query(
            `
      SELECT 
        id_user, 
        username, 
        email, 
        password_hash, 
        is_active,
        id_membre,
        role, 
        created_at,
        token_version,
        last_login
      FROM users
      WHERE username = $1
      `,
            [username]
        );

        if (result.rowCount === 0) {
            return res
                .status(401)
                .json({ message: "Nom d'utilisateur ou mot de passe incorrect" });
        }

        const row = result.rows[0];

        // 🧱 Vérif défensive : on doit avoir un hash en BDD
        if (!row.password_hash) {
            console.error(
                "Login error: password_hash manquant pour l'utilisateur",
                row.username
            );
            return res
                .status(500)
                .json({ message: "Mot de passe non configuré pour cet utilisateur" });
        }

        // ✅ Ici on compare le mot de passe saisi avec password_hash
        const ok = await bcrypt.compare(password, row.password_hash);
        if (!ok) {
            return res
                .status(401)
                .json({ message: "Nom d'utilisateur ou mot de passe incorrect" });
        }

        // 🔥 Mettre l'utilisateur en ligne + last_login
        await pool.query(
            `
      UPDATE users
      SET 
        is_active = TRUE,
        last_login = NOW()
      WHERE id_user = $1
      `,
            [row.id_user]
        );

        // On map la row brute en user "propre" pour le front et les tokens
        const user = mapUserRow(row);


        const { accessToken, refreshToken } = createTokenPair({
            id: user.idUser,
            username: user.username,
            role: user.role,
            tokenVersion: user.tokenVersion ?? 0,
        });

        const refreshExpiresAt = new Date(
            Date.now() + 1 * 24 * 60 * 60 * 1000
        );

        await refreshTokenRepo.create({
            userId: user.idUser,
            tokenHash: hashToken(refreshToken),
            revoked: false,
            expiresAt: refreshExpiresAt,
            userAgent: req.headers["user-agent"] as string | undefined,
            ipAddress: req.ip,
        });


        res.cookie(accessCookieName, accessToken, accessCookieOptions);
        res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);

        return res.json({
            message: "Login avec succès",
            user,
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Erreur serveur" });
    }
}


export const refresh = async (req: Request, res: Response) => {
    const token = req.cookies?.[refreshCookieName];

    if (!token) {
        return res.status(401).json({
            message: "Refresh token manquant",
            code: "NO_REFRESH_TOKEN",
        });
    }

    try {
        const decoded = verifyRefreshToken(token) as DecodedToken;

        if (!decoded.sub) {
            return res.status(401).json({
                message: "Token invalide (subject manquant)",
                code: "REFRESH_TOKEN_NO_SUB",
            });
        }

        const tokenHash = hashToken(token);
        const stored = await refreshTokenRepo.findByUserIdAndHash(
            decoded.sub,
            tokenHash
        );

        if (!stored || stored.revoked) {
            await refreshTokenRepo.revokeAllForUser(decoded.sub!);
            return res.status(401).json({
                message: "Refresh token invalide ou révoqué",
                code: "REFRESH_REUSED_OR_REVOKED",
            });
        }

        if (stored.expiresAt < new Date()) {
            return res.status(401).json({
                message: "Refresh token expiré, veuillez vous reconnecter",
                code: "REFRESH_EXPIRED_DB",
            });
        }

        const user = await findUserById(decoded.sub);
        if (!user) {
            return res.status(401).json({
                message: "Utilisateur introuvable",
                code: "USER_NOT_FOUND",
            });
        }

        if ((user.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
            return res.status(401).json({
                message: "Refresh token révoqué (version différente)",
                code: "REFRESH_REVOKED",
            });
        }

        await refreshTokenRepo.revoke(stored.id);

        const { accessToken, refreshToken } = createTokenPair({
            id: user.idUser,
            username: user.username,
            role: user.role,
            tokenVersion: user.tokenVersion ?? 0,
        });

        const refreshExpiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        await refreshTokenRepo.create({
            userId: user.idUser,
            tokenHash: hashToken(refreshToken),
            revoked: false,
            expiresAt: refreshExpiresAt,
            userAgent: req.headers["user-agent"] as string | undefined,
            ipAddress: req.ip,
        });

        res.cookie(accessCookieName, accessToken, accessCookieOptions);
        res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);

        return res.json({ message: "Tokens rafraîchis" });
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                message: "Refresh token expiré, veuillez vous reconnecter",
                code: "REFRESH_EXPIRED",
            });
        }

        return res.status(401).json({
            message: "Refresh token invalide",
            code: "REFRESH_INVALID",
        });
    }
};



export const logout = async (req: Request, res: Response) => {
    const token = req.cookies?.[refreshCookieName];

    try {
        if (token) {
            const decoded = verifyRefreshToken(token) as DecodedToken;
            const userId = decoded.sub;

            await refreshTokenRepo.revokeAllForUser(userId);

            await pool.query(
                `
        UPDATE users
        SET is_active = FALSE
        WHERE id_user = $1
        `,
                [userId]
            );
        }
    } catch (err) {
        console.error("Logout error:", err);

    }


    res.clearCookie(accessCookieName, { path: "/" });
    res.clearCookie(refreshCookieName, { path: "/" });

    return res.json({ message: "Déconnexion réussie" });
};