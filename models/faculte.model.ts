export interface FaculteRow {
    id_faculte: string;
    nom_faculte: string;
}

export interface Faculte {
    idFaculte: string;
    nomFaculte: string;
}

export function mapFaculteRowToModel(row: FaculteRow): Faculte {
    return {
        idFaculte: row.id_faculte,
        nomFaculte: row.nom_faculte,
    };
}