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
    createdAt: row.createdAt ?? row.created_at,
  };
}


export async function createUser(req: Request, res: Response) {
  try {
    const body = req.body as CreateUserInput;
    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [body.email]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);

    const result = await pool.query(
      `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, created_at AS "createdAt"
      `,
      [body.username, body.email, hashedPassword, body.role]
    );

    const user = mapUserRow(result.rows[0]);
    return res.status(201).json(user);
  } catch (err) {
    console.error("Error createUser:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const result = await pool.query(
      `
      SELECT id, username, email, role, created_at AS "createdAt"
      FROM users
      ORDER BY created_at DESC
      `
    );

    const users = result.rows.map(mapUserRow);
    return res.json(users);
  } catch (err) {
    console.error("Error getUsers:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// 📌 GET /users/:id
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT id, username, email, role, created_at AS "createdAt"
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = mapUserRow(result.rows[0]);
    return res.json(user);
  } catch (err) {
    console.error("Error getUserById:", err);
    return res.status(500).json({ error: "Internal server error" });
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
      return res.status(404).json({ error: "User not found" });
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
      RETURNING id, username, email, role, created_at AS "createdAt"
      `,
      [newUsername, newEmail, newPasswordHash, newRole, id]
    );

    const user = mapUserRow(result.rows[0]);
    return res.json(user);
  } catch (err) {
    console.error("Error updateUser:", err);
    return res.status(500).json({ error: "Internal server error" });
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
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleteUser:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
