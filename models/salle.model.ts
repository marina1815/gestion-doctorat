
export interface SalleRow {
  id_salle: string;
  nom_salle: string;
  capacite_salle: number;
}


export interface Salle {
  idSalle: string;
  nomSalle: string;
  capaciteSalle: number;
}


export function mapSalleRowToModel(row: SalleRow): Salle {
  return {
    idSalle: row.id_salle,
    nomSalle: row.nom_salle,
    capaciteSalle: row.capacite_salle,
  };
}