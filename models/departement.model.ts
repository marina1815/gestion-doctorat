export interface DepartementRow {
  id_departement: string;
  nom_departement: string;
  id_faculte: string;
}

export interface Departement {
  idDepartement: string;
  nomDepartement: string;
  idFaculte: string;
}

export function mapDepartementRowToModel(row: DepartementRow): Departement {
  return {
    idDepartement: row.id_departement,
    nomDepartement: row.nom_departement,
    idFaculte: row.id_faculte,
  };
}