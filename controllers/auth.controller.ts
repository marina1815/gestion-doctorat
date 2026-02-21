// src/controllers/auth.controller.ts

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/pool";
import { LoginInput } from "../dto/user.dto";

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

        // 1️⃣ Chercher l'utilisateur
        const result = await pool.query(
            `
      SELECT id, username, email, password, role, created_at 
      FROM users
      WHERE username = $1
      `,
            [username]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = result.rows[0];

        // 2️⃣ Vérifier le mot de passe hashé
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // 3️⃣ Retourner user (sans password)
        return res.json({
            message: "Login successful",
            user: mapUserRow(user), // pas de token
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}