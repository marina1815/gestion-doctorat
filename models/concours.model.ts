export interface ConcoursRow {
  id_concours: string;
  nom_councours: string;
  annee: number;
  date_concours: Date | null;
  id_departement: string;
}

export interface Concours {
  idConcours: string;
  nomConcours: string;
  annee: number;
  dateConcours: Date | null;
  idDepartement: string;
}

export function mapConcoursRowToModel(row: ConcoursRow): Concours {
  return {
    idConcours: row.id_concours,
    nomConcours: row.nom_councours,
    annee: row.annee,
    dateConcours: row.date_concours,
    idDepartement: row.id_departement,
  };
}