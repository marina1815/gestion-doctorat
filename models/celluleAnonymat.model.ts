export interface CelluleAnonymatRow {
  id_cellule_anonymat: string;
  id_concours: string;
  id_membre: string;
}

export interface CelluleAnonymat {
  idCelluleAnonymat: string;
  idConcours: string;
  idMembre: string;
}

export function mapCelluleAnonymatRowToModel(
  row: CelluleAnonymatRow
): CelluleAnonymat {
  return {
    idCelluleAnonymat: row.id_cellule_anonymat,
    idConcours: row.id_concours,
    idMembre: row.id_membre,
  };
}