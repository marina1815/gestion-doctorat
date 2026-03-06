export interface CorrecteurRow {
  id_correcteur: string;
  id_concours: string;
  id_membre: string;
  id_specialite: string;
}

export interface Correcteur {
  idCorrecteur: string;
  idConcours: string;
  idMembre: string;
  idSpecialite: string;
}

export function mapCorrecteurRowToModel(row: CorrecteurRow): Correcteur {
  return {
    idCorrecteur: row.id_correcteur,
    idConcours: row.id_concours,
    idMembre: row.id_membre,
    idSpecialite: row.id_specialite,
  };
}