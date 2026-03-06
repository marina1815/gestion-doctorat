// models/viceDoyen.model.ts

export interface ViceDoyenRow {
  id_vice_doyen: string;
  id_faculte: string;
  id_membre: string;
}

export interface ViceDoyen {
  idViceDoyen: string;
  idFaculte: string;
  idMembre: string;
}

export function mapViceDoyenRowToModel(row: ViceDoyenRow): ViceDoyen {
  return {
    idViceDoyen: row.id_vice_doyen,
    idFaculte: row.id_faculte,
    idMembre: row.id_membre,
  };
}