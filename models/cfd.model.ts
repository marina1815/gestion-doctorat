
export interface CfdRow {
  id_cfd: string;
  id_concours: string;
  id_user: string;
}

export interface Cfd {
  idCfd: string;
  idConcours: string;
  idUser: string;
}

export function mapCfdRowToModel(row: CfdRow): Cfd {
  return {
    idCfd: row.id_cfd,
    idConcours: row.id_concours,
    idUser: row.id_user,
  };
}