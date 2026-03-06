import { Request, Response } from "express";
import { pool } from "../db/pool";
import {
  CorrecteurRow,
  Correcteur,
  mapCorrecteurRowToModel,
} from "../models/correcteur.model";

/**
 * GET /api/correcteurs
 */
export async function getCorrecteurs(req: Request, res: Response) {
  try {
    const result = await pool.query<CorrecteurRow>(`
      SELECT *
      FROM correcteur
      ORDER BY id_concours, id_membre, id_specialite
    `);

    const correcteurs: Correcteur[] = result.rows.map(mapCorrecteurRowToModel);
    return res.json(correcteurs);
  } catch (err) {
    console.error("Error getCorrecteurs:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function getCorrecteurById(req: Request, res: Response) {
  try {
    const { idCorrecteur } = req.params;

    const result = await pool.query<CorrecteurRow>(
      `
      SELECT *
      FROM correcteur
      WHERE id_correcteur = $1
      `,
      [idCorrecteur]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Correcteur introuvable" });
    }

    const correcteur = mapCorrecteurRowToModel(result.rows[0]);
    return res.json(correcteur);
  } catch (err) {
    console.error("Error getCorrecteurById:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function getCorrecteursByConcours(req: Request, res: Response) {
  try {
    const { idConcours } = req.params;

    const result = await pool.query<CorrecteurRow>(
      `
      SELECT *
      FROM correcteur
      WHERE id_concours = $1
      ORDER BY id_membre, id_specialite
      `,
      [idConcours]
    );

    const correcteurs: Correcteur[] = result.rows.map(mapCorrecteurRowToModel);
    return res.json(correcteurs);
  } catch (err) {
    console.error("Error getCorrecteursByConcours:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function createCorrecteur(req: Request, res: Response) {
  try {
    const { idConcours, idMembre, idSpecialite } = req.body as {
      idConcours: string;
      idMembre: string;
      idSpecialite: string;
    };

    const result = await pool.query<CorrecteurRow>(
      `
      INSERT INTO correcteur (id_concours, id_membre, id_specialite)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [idConcours, idMembre, idSpecialite]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Correcteur introuvable" });
    }

    const correcteur = mapCorrecteurRowToModel(result.rows[0]);
    return res.status(201).json(correcteur);
  } catch (err: any) {
    console.error("Error createCorrecteur:", err);

    // Unique constraint
    if (err.code === "23505") {
      return res.status(400).json({
        error: "Ce correcteur est déjà affecté à ce concours.",
      });
    }

    return res.status(500).json({ error: "Erreur serveur" });
  }
}

/**
 * PUT /api/correcteurs/:idCorrecteur
 */
export async function updateCorrecteur(req: Request, res: Response) {
  try {
    const { idCorrecteur } = req.params;
    const { idConcours, idMembre, idSpecialite } = req.body as {
      idConcours?: string;
      idMembre?: string;
      idSpecialite?: string;
    };

    const existing = await pool.query<CorrecteurRow>(
      `SELECT * FROM correcteur WHERE id_correcteur = $1`,
      [idCorrecteur]
    );

    if (!existing.rows[0]) {
      return res.status(404).json({ error: "Correcteur introuvable" });
    }

    const current = existing.rows[0];

    const newIdConcours = idConcours ?? current.id_concours;
    const newIdUser = idMembre ?? current.id_membre;
    const newIdSpecialite = idSpecialite ?? current.id_specialite;

    const result = await pool.query<CorrecteurRow>(
      `
      UPDATE correcteur
      SET id_concours = $1,
          id_membre = $2,
          id_specialite = $3
      WHERE id_correcteur = $4
      RETURNING *
      `,
      [newIdConcours, newIdUser, newIdSpecialite, idCorrecteur]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Correcteur introuvable" });
    }

    const correcteur = mapCorrecteurRowToModel(result.rows[0]);
    return res.json(correcteur);
  } catch (err: any) {
    console.error("Error updateCorrecteur:", err);

    if (err.code === "23505") {
      return res.status(400).json({
        error: "Ce correcteur est déjà affecté à ce concours.",
      });
    }

    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function deleteCorrecteur(req: Request, res: Response) {
  try {
    const { idCorrecteur } = req.params;

    const result = await pool.query(
      `
      DELETE FROM correcteur
      WHERE id_correcteur = $1
      `,
      [idCorrecteur]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Correcteur introuvable" });
    }

    return res.json({ message: "Correcteur supprimé avec succès" });
  } catch (err) {
    console.error("Error deleteCorrecteur:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}