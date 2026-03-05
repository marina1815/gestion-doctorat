export interface CorrecteurRow {
  id_correcteur: string;
  id_concours: string;
  id_user: string;
  id_specialite: string;
}

export interface Correcteur {
  idCorrecteur: string;
  idConcours: string;
  idUser: string;
  idSpecialite: string;
}

export function mapCorrecteurRowToModel(row: CorrecteurRow): Correcteur {
  return {
    idCorrecteur: row.id_correcteur,
    idConcours: row.id_concours,
    idUser: row.id_user,
    idSpecialite: row.id_specialite,
  };
}