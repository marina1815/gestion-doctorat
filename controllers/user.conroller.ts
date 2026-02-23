import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/pool";
import { CreateUserInput, UpdateUserInput } from "../dto/user.dto";

function mapUserRow(row: any) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    created_at: row.created_at ?? row.created_at,
  };
}


export async function createUser(req: Request, res: Response) {
  try {
    const body = req.body as CreateUserInput;
    const existingName = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [body.username]
    );

    if (existingName.rowCount && existingName.rowCount > 0) {
      return res.status(409).json({ error: "Nom d'utilisateur déjà utilisé" });
    }
    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [body.email]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({ error: "Email déjà utilisé " });
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);

    const result = await pool.query(
      `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, created_at 
      `,
      [body.username, body.email, hashedPassword, body.role]
    );

    const user = mapUserRow(result.rows[0]);
    return res.status(201).json(user);
  } catch (err) {
    console.error("Error createUser:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const result = await pool.query(
      `
      SELECT id, username, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      `
    );

    const users = result.rows.map(mapUserRow);
    return res.json(users);
  } catch (err) {
    console.error("Error getUsers:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// 📌 GET /users/:id
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT id, username, email, role, created_at 
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const user = mapUserRow(result.rows[0]);
    return res.json(user);
  } catch (err) {
    console.error("Error getUserById:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function findUserById(id: string) {
  try {
    const result = await pool.query(
      `
      SELECT 
        id, 
        username, 
        email, 
        role, 
        created_at,
        token_version 
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    // ⚠️ Ici on ne passe PAS par mapUserRow
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      tokenVersion: row.tokenVersion ?? 0,
      created_at: row.created_at,
    };
  } catch (err) {
    console.error("Error findUserById:", err);
    return null;
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body as UpdateUserInput;

    const existing = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const current = existing.rows[0];

    const newUsername = body.username ?? current.username;
    const newEmail = body.email ?? current.email;
    const newRole = body.role ?? current.role;

    let newPasswordHash = current.password;
    if (body.password) {
      newPasswordHash = await bcrypt.hash(body.password, 12);
    }

    const result = await pool.query(
      `
      UPDATE users
      SET username = $1,
          email = $2,
          password = $3,
          role = $4
      WHERE id = $5
      RETURNING id, username, email, role, created_at 
      `,
      [newUsername, newEmail, newPasswordHash, newRole, id]
    );

    const user = mapUserRow(result.rows[0]);
    return res.json(user);
  } catch (err) {
    console.error("Error updateUser:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM users WHERE id = $1`,
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
