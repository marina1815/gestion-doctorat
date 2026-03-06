
export interface CreateCommissionElaborationSujetsDto {
  idConcours: string;
  idMembre: string;
  idSpecialite: string;
}

export interface CommissionElaborationSujetsResponseDto {
  idCommission: string;
  idConcours: string;
  idMembre: string;
  idSpecialite: string;
}