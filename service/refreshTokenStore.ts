import crypto from "crypto";
import { pool } from "../db/pool";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface StoredRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  revoked: boolean;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface RefreshTokenRepository {
  create(data: Omit<StoredRefreshToken, "id">): Promise<StoredRefreshToken>;
  findByUserIdAndHash(
    userId: string,
    tokenHash: string
  ): Promise<StoredRefreshToken | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export const refreshTokenRepo: RefreshTokenRepository = {
  async create(data) {
    const result = await pool.query(
      `
      INSERT INTO refresh_tokens (user_id, token_hash, revoked, expires_at, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, token_hash, revoked, expires_at, user_agent, ip_address
    `,
      [
        data.userId,
        data.tokenHash,
        data.revoked,
        data.expiresAt,
        data.userAgent ?? null,
        data.ipAddress ?? null,
      ]
    );

    const row = result.rows[0];

    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      revoked: row.revoked,
      expiresAt: new Date(row.expires_at),
      userAgent: row.user_agent ?? undefined,
      ipAddress: row.ip_address ?? undefined,
    };
  },

  async findByUserIdAndHash(userId, tokenHash) {
    const result = await pool.query(
      `
      SELECT id, user_id, token_hash, revoked, expires_at, user_agent, ip_address
      FROM refresh_tokens
      WHERE user_id = $1 AND token_hash = $2
      LIMIT 1
    `,
      [userId, tokenHash]
    );

    if (result.rowCount === 0) return null;

    const row = result.rows[0];

    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      revoked: row.revoked,
      expiresAt: new Date(row.expires_at),
      userAgent: row.user_agent ?? undefined,
      ipAddress: row.ip_address ?? undefined,
    };
  },

  async revoke(id) {
    await pool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`, [
      id,
    ]);
  },

  async revokeAllForUser(userId) {
    await pool.query(
      `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`,
      [userId]
    );
  },
};