export type StatutCandidat = "PRESENT" | "ABSENT";

export interface CandidatRow {
  id_candidat: string;
  nom_candidat: string;
  prenom_candidat: string;
  matricule: string;
  date_naissance: Date | null;
  statut_commun: StatutCandidat;
  statut_specialite: StatutCandidat;
  id_specialite: string;
}

export interface Candidat {
  idCandidat: string;
  nomCandidat: string;
  prenomCandidat: string;
  matricule: string;
  dateNaissance: Date | null;
  statutCommun: StatutCandidat;
  statutSpecialite: StatutCandidat;
  idSpecialite: string;
}

export function mapCandidatRowToModel(row: CandidatRow): Candidat {
  return {
    idCandidat: row.id_candidat,
    nomCandidat: row.nom_candidat,
    prenomCandidat: row.prenom_candidat,
    matricule: row.matricule,
    dateNaissance: row.date_naissance,
    statutCommun: row.statut_commun,
    statutSpecialite: row.statut_specialite,
    idSpecialite: row.id_specialite,
  };
}