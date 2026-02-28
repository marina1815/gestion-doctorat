// user.model.ts
export type UserRole =
  | "ADMIN"
  | "CHEFDEPARTEMENT"
  | "CFD"
  | "CELLULE_ANONYMAT"
  | "CORRECTEUR"
  | "RESPONSABLE_SALLE"
  | "DOYEN"
  | "VICEDOYEN"
  | "RECTEUR";

// Représente la ligne brute de la table "users" (snake_case)
export interface UserRow {
  id_user: string;
  username: string;
  email: string | null;
  password_hash: string;
  role: UserRole;
  token_version: number;
  is_active: boolean;
  created_at: Date;
  last_login: Date | null;
  id_membre: string;
}

// Modèle côté app (camelCase)
export interface User {
  idUser: string;
  username: string;
  email: string | null;
  role: UserRole;
  tokenVersion?: number;
  isActive: boolean;
  createdAt: Date;
  lastLogin: Date | null;
  idMembre: string;
}

// Mapper BDD -> modèle app
export function mapUserRowToModel(row: UserRow): User {
  return {
    idUser: row.id_user,
    username: row.username,
    email: row.email,
    role: row.role,
    tokenVersion: row.token_version,
    isActive: row.is_active,
    createdAt: row.created_at,
    lastLogin: row.last_login,
    idMembre: row.id_membre,
  };
}