import { Request, Response } from "express";
import { pool } from "../db/pool";
import {
  CreateCandidatInput,
  UpdateCandidatInput,
} from "../dto/candidat.dto";
import {
  CandidatRow,
  Candidat,
  mapCandidatRowToModel,
} from "../models/candidat.model";

// ========================
// CREATE
// ========================
export async function createCandidat(req: Request, res: Response) {
  try {
    const {
      nomCandidat,
      prenomCandidat,
      matricule,
      dateNaissance,
      statutCommun,
      statutSpecialite,
      idSpecialite,
    } = req.body as CreateCandidatInput;

    const result = await pool.query<CandidatRow>(
      `
      INSERT INTO candidat (
        nom_candidat,
        prenom_candidat,
        matricule,
        date_naissance,
        statut_commun,
        statut_specialite,
        id_specialite
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        nomCandidat,
        prenomCandidat,
        matricule,
        dateNaissance ?? null,
        statutCommun,
        statutSpecialite,
        idSpecialite,
      ]
    );

    const row = result.rows[0];
    if (!row) {
      return res
        .status(500)
        .json({ error: "Aucune ligne retournée lors de la création du candidat" });
    }

    const candidat: Candidat = mapCandidatRowToModel(row);

    return res.status(201).json({
      message: "Candidat créé avec succès",
      candidat,
    });
  } catch (err) {
    console.error("Error createCandidat:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ========================
// GET ALL
// ========================
export async function getCandidats(req: Request, res: Response) {
  try {
    const result = await pool.query<CandidatRow>(
      `
      SELECT *
      FROM candidat
      ORDER BY nom_candidat ASC, prenom_candidat ASC
      `
    );

    const candidats: Candidat[] = result.rows.map(mapCandidatRowToModel);
    return res.json(candidats);
  } catch (err) {
    console.error("Error getCandidats:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ========================
// GET BY ID
// ========================
export async function getCandidatById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query<CandidatRow>(
      `
      SELECT *
      FROM candidat
      WHERE id_candidat = $1
      `,
      [id]
    );

    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: "Candidat non trouvé" });
    }

    const candidat: Candidat = mapCandidatRowToModel(row);
    return res.json(candidat);
  } catch (err) {
    console.error("Error getCandidatById:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ========================
// GET BY SPECIALITE
// ========================
export async function getCandidatsBySpecialite(req: Request, res: Response) {
  try {
    const { idSpecialite } = req.params;

    const result = await pool.query<CandidatRow>(
      `
      SELECT *
      FROM candidat
      WHERE id_specialite = $1
      ORDER BY nom_candidat ASC, prenom_candidat ASC
      `,
      [idSpecialite]
    );

    const candidats: Candidat[] = result.rows.map(mapCandidatRowToModel);
    return res.json(candidats);
  } catch (err) {
    console.error("Error getCandidatsBySpecialite:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ========================
// UPDATE
// ========================
export async function updateCandidat(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      nomCandidat,
      prenomCandidat,
      matricule,
      dateNaissance,
      statutCommun,
      statutSpecialite,
      idSpecialite,
    } = req.body as UpdateCandidatInput;

    const existing = await pool.query<CandidatRow>(
      `SELECT * FROM candidat WHERE id_candidat = $1`,
      [id]
    );

    const current = existing.rows[0];
    if (!current) {
      return res.status(404).json({ error: "Candidat non trouvé" });
    }

    const newNom = nomCandidat ?? current.nom_candidat;
    const newPrenom = prenomCandidat ?? current.prenom_candidat;
    const newMatricule = matricule ?? current.matricule;
    const newDateNaissance = dateNaissance ?? current.date_naissance;
    const newStatutCommun = statutCommun ?? current.statut_commun;
    const newStatutSpecialite =
      statutSpecialite ?? current.statut_specialite;
    const newIdSpecialite = idSpecialite ?? current.id_specialite;

    const result = await pool.query<CandidatRow>(
      `
      UPDATE candidat
      SET nom_candidat = $1,
          prenom_candidat = $2,
          matricule = $3,
          date_naissance = $4,
          statut_commun = $5,
          statut_specialite = $6,
          id_specialite = $7
      WHERE id_candidat = $8
      RETURNING *
      `,
      [
        newNom,
        newPrenom,
        newMatricule,
        newDateNaissance,
        newStatutCommun,
        newStatutSpecialite,
        newIdSpecialite,
        id,
      ]
    );

    const row = result.rows[0];
    if (!row) {
      return res
        .status(500)
        .json({ error: "Aucune ligne retournée lors de la mise à jour" });
    }

    const candidat: Candidat = mapCandidatRowToModel(row);

    return res.json({
      message: "Candidat mis à jour avec succès",
      candidat,
    });
  } catch (err) {
    console.error("Error updateCandidat:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ========================
// DELETE
// ========================
export async function deleteCandidat(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM candidat
      WHERE id_candidat = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Candidat non trouvé" });
    }

    return res.json({ message: "Candidat supprimé avec succès" });
  } catch (err) {
    console.error("Error deleteCandidat:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}