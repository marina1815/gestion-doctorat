import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/pool";
import { LoginInput } from "../dto/user.dto";
import { findUserById } from "./user.conroller";
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

function mapUserRow(row: any) {
    return {
        id: row.id,
        username: row.username,
        email: row.email,
        role: row.role,
        created_at: row.created_at,
    };
}

export async function login(req: Request, res: Response) {
    try {
        const { username, password } = req.body as LoginInput;

        const result = await pool.query(
            `
      SELECT 
        id, 
        username, 
        email, 
        password, 
        role, 
        created_at,
        token_version 
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

        const user = result.rows[0];

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res
                .status(401)
                .json({ message: "Nom d'utilisateur ou mot de passe incorrect" });
        }


        const { accessToken, refreshToken } = createTokenPair({
            id: user.id,
            username: user.username,
            role: user.role,
            tokenVersion: user.tokenVersion ?? 0,
        });


        const refreshExpiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 jours
        );

        await refreshTokenRepo.create({
            userId: user.id,
            tokenHash: hashToken(refreshToken),
            revoked: false,
            expiresAt: refreshExpiresAt,
            userAgent: req.headers["user-agent"] as string | undefined,
            ipAddress: req.ip,
        });

        // 🍪 Poser les cookies httpOnly
        res.cookie(accessCookieName, accessToken, accessCookieOptions);
        res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);

        return res.json({
            message: "Login avec succès",
            user: mapUserRow(user),
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
            id: user.id,
            username: user.username,
            role: user.role,
            tokenVersion: user.tokenVersion ?? 0,
        });

        const refreshExpiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        await refreshTokenRepo.create({
            userId: user.id,
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

    if (token) {
        try {
            const decoded = verifyRefreshToken(token) as DecodedToken;
            // 🔐 Révoquer tous les refresh tokens de cet utilisateur
            await refreshTokenRepo.revokeAllForUser(decoded.sub);
        } catch {
            // on ignore si token invalide/expiré
        }
    }

    res.clearCookie(accessCookieName, { path: "/" });
    res.clearCookie(refreshCookieName, { path: "/auth" });

    return res.json({ message: "Déconnexion réussie" });
};