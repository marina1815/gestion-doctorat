// controllers/user.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/pool";
import {
  CreateUserInput,
  UpdateUserInput,
} from "../dto/user.dto";


import type { UserRow, User } from "../models/user.model";
import { mapUserRowToModel } from "../models/user.model";


export async function createUser(req: Request, res: Response) {
  try {
    const { username, email, password, role , idMembre } = req.body as CreateUserInput;

    // Vérifier username unique
    const existingName = await pool.query(
      `SELECT id_user FROM users WHERE username = $1`,
      [username]
    );
    if (existingName.rowCount && existingName.rowCount > 0) {
      return res.status(409).json({ error: "Nom d'utilisateur déjà utilisé" });
    }

   
    const existingEmail = await pool.query(
      `SELECT id_user FROM users WHERE email = $1`,
      [email]
    );
    if (existingEmail.rowCount && existingEmail.rowCount > 0) {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    
   

    const result = await pool.query<UserRow>(
      `
      INSERT INTO users (
        username,
        email,
        password_hash,
        role,
        id_membre
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [username, email, hashedPassword, role, idMembre]
    );

    const row = result.rows[0];
    if (!row) {
      return res
        .status(500)
        .json({ error: "Aucune ligne retournée lors de la création de l'utilisateur" });
    }

    const user: User = mapUserRowToModel(row);

    return res.status(201).json({
      message: "Utilisateur créé avec succès",
      user,
    });
  } catch (err) {
    console.error("Error createUser:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}


export async function getUsers(req: Request, res: Response) {
  try {
    const result = await pool.query<UserRow>(
      `
      SELECT *
      FROM users
      ORDER BY created_at DESC
      `
    );

    const users: User[] = result.rows.map(mapUserRowToModel);
    return res.json(users);
  } catch (err) {
    console.error("Error getUsers:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function findUserByIdMembre(idMembre: string): Promise<User | null> {
  try {
    const result = await pool.query<UserRow>(
      `
      SELECT *
      FROM users
      WHERE id_membre = $1
      `,
      [idMembre]
    );

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return mapUserRowToModel(row);
  } catch (err) {
    console.error("Error findUserByIdMembre:", err);
    return null;
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query<UserRow>(
      `
      SELECT *
      FROM users
      WHERE id_user = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const row = result.rows[0];
    if (!row) {
      return res.status(500).json({ error: "Erreur interne: ligne utilisateur manquante" });
    }

    const user: User = mapUserRowToModel(row);
    return res.json(user);
  } catch (err) {
    console.error("Error getUserById:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}


export async function findUserById(id: string): Promise<User | null> {
  try {
    const result = await pool.query<UserRow>(
      `
      SELECT *
      FROM users
      WHERE id_user = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return mapUserRowToModel(row);
  } catch (err) {
    console.error("Error findUserById:", err);
    return null;
  }
}

/**
 * 📌 PUT /users/:id
 * Met à jour un utilisateur
 */
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body as UpdateUserInput;

    const existing = await pool.query<UserRow>(
      `SELECT * FROM users WHERE id_user = $1`,
      [id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const current = existing.rows[0];
    if (!current) {
      return res.status(500).json({ error: "Erreur interne: ligne utilisateur manquante" });
    }

    const newUsername = body.username ?? current.username;
    const newEmail = body.email ?? current.email;
    const newRole = body.role ?? current.role;

    let newPasswordHash = current.password_hash;
    if (body.password) {
      newPasswordHash = await bcrypt.hash(body.password, 12);
    }

    const result = await pool.query<UserRow>(
      `
      UPDATE users
      SET username      = $1,
          email         = $2,
          password_hash = $3,
          role          = $4
      WHERE id_user = $5
      RETURNING *
      `,
      [newUsername, newEmail, newPasswordHash, newRole, id]
    );

    const row = result.rows[0];
    if (!row) {
      return res
        .status(500)
        .json({ error: "Aucune ligne retournée lors de la mise à jour de l'utilisateur" });
    }

    const updatedUser: User = mapUserRowToModel(row);
    return res.json({
      message: "Utilisateur mis à jour avec succès",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updateUser:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

/**
 * 📌 DELETE /users/:id
 * Supprime un utilisateur
 */
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM users WHERE id_user = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    return res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    console.error("Error deleteUser:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}