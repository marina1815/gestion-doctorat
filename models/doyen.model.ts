// src/models/doyen.model.ts

export interface DoyenRow {
  id_doyen: string;
  id_user: string;
  id_faculte: string;
}

export interface Doyen {
  idDoyen: string;
  idUser: string;
  idFaculte: string;
}

export function mapDoyenRowToModel(row: DoyenRow): Doyen {
  return {
    idDoyen: row.id_doyen,
    idUser: row.id_user,
    idFaculte: row.id_faculte,
  };
}