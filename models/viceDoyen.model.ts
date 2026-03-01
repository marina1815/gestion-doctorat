// models/viceDoyen.model.ts

export interface ViceDoyenRow {
  id_vice_doyen: string;
  id_faculte: string;
  id_user: string;
}

export interface ViceDoyen {
  idViceDoyen: string;
  idFaculte: string;
  idUser: string;
}

export function mapViceDoyenRowToModel(row: ViceDoyenRow): ViceDoyen {
  return {
    idViceDoyen: row.id_vice_doyen,
    idFaculte: row.id_faculte,
    idUser: row.id_user,
  };
}