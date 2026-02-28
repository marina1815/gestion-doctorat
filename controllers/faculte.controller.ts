import { Request, Response } from "express";
import { pool } from "../db/pool";
import { CreateFaculteDto, UpdateFaculteDto } from "../dto/faculte.dto";
import {
  FaculteRow,
  Faculte,
  mapFaculteRowToModel,
} from "../models/faculte.model";

// ========================
// CREATE
// ========================
export async function createFaculte(req: Request, res: Response) {
  try {
    const { nomFaculte } = req.body as CreateFaculteDto;

    const result = await pool.query<FaculteRow>(
      `
      INSERT INTO faculte (nom_faculte)
      VALUES ($1)
      RETURNING *
      `,
      [nomFaculte]
    );

    const row = result.rows[0];
    if (!row) {
      // Très improbable avec INSERT RETURNING, mais on gère pour TS et robustesse
      return res
        .status(500)
        .json({ error: "Aucune ligne retournée lors de la création de la faculté" });
    }

    const faculte: Faculte = mapFaculteRowToModel(row);

    return res.status(201).json({
      message: "Faculté créée avec succès",
      faculte,
    });
  } catch (err) {
    console.error("Error createFaculte:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ========================
// GET ALL
// ========================
export async function getFacultes(req: Request, res: Response) {
  try {
    const result = await pool.query<FaculteRow>(
      `
      SELECT *
      FROM faculte
      ORDER BY nom_faculte ASC
      `
    );

    const facultes: Faculte[] = result.rows.map(mapFaculteRowToModel);
    return res.json(facultes);
  } catch (err) {
    console.error("Error getFacultes:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ========================
// GET BY ID
// ========================
export async function getFaculteById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query<FaculteRow>(
      `
      SELECT *
      FROM faculte
      WHERE id_faculte = $1
      `,
      [id]
    );

    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: "Faculté non trouvée" });
    }

    const faculte: Faculte = mapFaculteRowToModel(row);
    return res.json(faculte);
  } catch (err) {
    console.error("Error getFaculteById:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ========================
// UPDATE
// ========================
export async function updateFaculte(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nomFaculte } = req.body as UpdateFaculteDto;

    const existing = await pool.query<FaculteRow>(
      `SELECT * FROM faculte WHERE id_faculte = $1`,
      [id]
    );

    const current = existing.rows[0];
    if (!current) {
      return res.status(404).json({ error: "Faculté non trouvée" });
    }

    const newNom = nomFaculte ?? current.nom_faculte;

    const result = await pool.query<FaculteRow>(
      `
      UPDATE faculte
      SET nom_faculte = $1
      WHERE id_faculte = $2
      RETURNING *
      `,
      [newNom, id]
    );

    const row = result.rows[0];
    if (!row) {
      return res
        .status(500)
        .json({ error: "Aucune ligne retournée lors de la mise à jour" });
    }

    const faculte: Faculte = mapFaculteRowToModel(row);

    return res.json({
      message: "Faculté mise à jour avec succès",
      faculte,
    });
  } catch (err) {
    console.error("Error updateFaculte:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ========================
// DELETE
// ========================
export async function deleteFaculte(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM faculte
      WHERE id_faculte = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Faculté non trouvée" });
    }

    return res.json({ message: "Faculté supprimée avec succès" });
  } catch (err) {
    console.error("Error deleteFaculte:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}