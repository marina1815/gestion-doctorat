export interface CelluleAnonymatRow {
  id_cellule_anonymat: string;
  id_concours: string;
  id_user: string;
}

export interface CelluleAnonymat {
  idCelluleAnonymat: string;
  idConcours: string;
  idUser: string;
}

export function mapCelluleAnonymatRowToModel(
  row: CelluleAnonymatRow
): CelluleAnonymat {
  return {
    idCelluleAnonymat: row.id_cellule_anonymat,
    idConcours: row.id_concours,
    idUser: row.id_user,
  };
}