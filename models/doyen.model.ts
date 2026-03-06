// src/models/doyen.model.ts

export interface DoyenRow {
  id_doyen: string;
  id_membre: string;
  id_faculte: string;
}

export interface Doyen {
  idDoyen: string;
  idMembre: string;
  idFaculte: string;
}

export function mapDoyenRowToModel(row: DoyenRow): Doyen {
  return {
    idDoyen: row.id_doyen,
    idMembre: row.id_membre,
    idFaculte: row.id_faculte,
  };
}