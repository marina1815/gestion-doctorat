

export type Sexe = "HOMME" | "FEMME";


export interface MembreRow {
  id_membre: string;
  nom_membre: string;
  prenom_membre: string;
  nom_ar: string | null;
  prenom_ar: string | null;
  grade: string | null;
  sexe: Sexe;
}


export interface Membre {
  idMembre: string;
  nomMembre: string;
  prenomMembre: string;
  nomAr: string | null;
  prenomAr: string | null;
  grade: string | null;
  sexe: Sexe;
}

export function mapMembreRowToModel(row: MembreRow): Membre {
  return {
    idMembre: row.id_membre,
    nomMembre: row.nom_membre,
    prenomMembre: row.prenom_membre,
    nomAr: row.nom_ar,
    prenomAr: row.prenom_ar,
    grade: row.grade,
    sexe: row.sexe,
  };
}

