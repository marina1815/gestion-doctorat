
export interface CfdRow {
  id_cfd: string;
  id_concours: string;
  id_membre: string;
}

export interface Cfd {
  idCfd: string;
  idConcours: string;
  idMembre: string;
}

export function mapCfdRowToModel(row: CfdRow): Cfd {
  return {
    idCfd: row.id_cfd,
    idConcours: row.id_concours,
    idMembre: row.id_membre,
  };
}