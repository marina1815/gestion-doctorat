
export interface ResponsableSalleRow {
  id_responsable_salle: string;
  id_concours: string;
  id_membre: string;
  id_salle: string;
}

export interface ResponsableSalle {
  idResponsableSalle: string;
  idConcours: string;
  idMembre: string;
  idSalle: string;
}


export function mapResponsableSalleRowToModel(
  row: ResponsableSalleRow
): ResponsableSalle {
  return {
    idResponsableSalle: row.id_responsable_salle,
    idConcours: row.id_concours,
    idMembre: row.id_membre,
    idSalle: row.id_salle,
  };
}