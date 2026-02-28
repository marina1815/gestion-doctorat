export interface SpecialiteRow {
  id_specialite: string;
  filiere: string;
  nom_specialite: string;
  nombre_places: number;
  id_concours: string;
}

export interface Specialite {
  idSpecialite: string;
  filiere: string;
  nomSpecialite: string;
  nombrePlaces: number;
  idConcours: string;
}

export function mapSpecialiteRowToModel(row: SpecialiteRow): Specialite {
  return {
    idSpecialite: row.id_specialite,
    filiere: row.filiere,
    nomSpecialite: row.nom_specialite,
    nombrePlaces: row.nombre_places,
    idConcours: row.id_concours,
  };
}