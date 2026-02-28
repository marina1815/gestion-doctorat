import { Request, Response } from "express";
import { pool } from "../db/pool";
import {
  CreateConcoursInput,
  UpdateConcoursInput,
} from "../dto/concours.dto";
import {
  ConcoursRow,
  Concours,
  mapConcoursRowToModel,
} from "../models/concours.model";

// ========================
// CREATE
// ========================
export async function createConcours(req: Request, res: Response) {
  try {
    const { nomConcours, annee, dateConcours, idDepartement } =
      req.body as CreateConcoursInput;

    const result = await pool.query<ConcoursRow>(
      `
      INSERT INTO concours (
        nom_councours,
        annee,
        date_concours,
        id_departement
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [nomConcours, annee, dateConcours ?? null, idDepartement]
    );

    const row = result.rows[0];
    if (!row) {
      return res
        .status(500)
        .json({ error: "Aucune ligne retournée lors de la création du concours" });
    }

    const concours: Concours = mapConcoursRowToModel(row);

    return res.status(201).json({
      message: "Concours créé avec succès",
      concours,
    });
  } catch (err) {
    console.error("Error createConcours:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ========================
// GET ALL
// ========================
export async function getConcours(req: Request, res: Response) {
  try {
    const result = await pool.query<ConcoursRow>(
      `
      SELECT *
      FROM concours
      ORDER BY annee DESC, nom_councours ASC
      `
    );

    const concours: Concours[] = result.rows.map(mapConcoursRowToModel);
    return res.json(concours);
  } catch (err) {
    console.error("Error getConcours:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ========================
// GET BY ID
// ========================
export async function getConcoursById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query<ConcoursRow>(
      `
      SELECT *
      FROM concours
      WHERE id_concours = $1
      `,
      [id]
    );

    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: "Concours non trouvé" });
    }

    const concours: Concours = mapConcoursRowToModel(row);
    return res.json(concours);
  } catch (err) {
    console.error("Error getConcoursById:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ========================
// GET BY DEPARTEMENT
// ========================
export async function getConcoursByDepartement(req: Request, res: Response) {
  try {
    const { idDepartement } = req.params;

    const result = await pool.query<ConcoursRow>(
      `
      SELECT *
      FROM concours
      WHERE id_departement = $1
      ORDER BY annee DESC, nom_councours ASC
      `,
      [idDepartement]
    );

    const concours: Concours[] = result.rows.map(mapConcoursRowToModel);
    return res.json(concours);
  } catch (err) {
    console.error("Error getConcoursByDepartement:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}



// ========================
// UPDATE
// ========================
export async function updateConcours(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nomConcours, annee, dateConcours, idDepartement } =
      req.body as UpdateConcoursInput;

    const existing = await pool.query<ConcoursRow>(
      `SELECT * FROM concours WHERE id_concours = $1`,
      [id]
    );

    const current = existing.rows[0];
    if (!current) {
      return res.status(404).json({ error: "Concours non trouvé" });
    }

    const newNom = nomConcours ?? current.nom_councours;
    const newAnnee = annee ?? current.annee;
    const newDate = dateConcours ?? current.date_concours;
    const newIdDepartement = idDepartement ?? current.id_departement;

    const result = await pool.query<ConcoursRow>(
      `
      UPDATE concours
      SET nom_councours = $1,
          annee = $2,
          date_concours = $3,
          id_departement = $4
      WHERE id_concours = $5
      RETURNING *
      `,
      [newNom, newAnnee, newDate, newIdDepartement, id]
    );

    const row = result.rows[0];
    if (!row) {
      return res
        .status(500)
        .json({ error: "Aucune ligne retournée lors de la mise à jour" });
    }

    const concours: Concours = mapConcoursRowToModel(row);

    return res.json({
      message: "Concours mis à jour avec succès",
      concours,
    });
  } catch (err) {
    console.error("Error updateConcours:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ========================
// DELETE
// ========================
export async function deleteConcours(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM concours
      WHERE id_concours = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Concours non trouvé" });
    }

    return res.json({ message: "Concours supprimé avec succès" });
  } catch (err) {
    console.error("Error deleteConcours:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}


export async function getDepartementsByConcours(req: Request, res: Response) {
    try {
        const { idConcours } = req.params;

       
        const result = await pool.query<{
            nom_departement: string;
            nom_faculte: string;
        }>  (
            `
      SELECT d.nom_departement, f.nom_faculte
      FROM concours c
      JOIN departement d ON d.id_departement = c.id_departement
      JOIN faculte f ON f.id_faculte = d.id_faculte
      WHERE c.id_concours = $1
      `,
            [idConcours]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Concours introuvable" });
        }

        const row = result.rows[0];


        return res.json({
            row
        });
    } catch (err) {
        console.error("Error getDepartementsByConcours:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}