
export interface CommissionElaborationSujetsRow {
  id_commission: string;
  id_concours: string;
  id_membre: string;
  id_specialite: string;
}

export interface CommissionElaborationSujets {
  idCommission: string;
  idConcours: string;
  idMembre: string;
  idSpecialite: string;
}


export function mapCommissionElaborationSujetsRowToModel(
  row: CommissionElaborationSujetsRow
): CommissionElaborationSujets {
  return {
    idCommission: row.id_commission,
    idConcours: row.id_concours,
    idMembre: row.id_membre,
    idSpecialite: row.id_specialite,
  };
}