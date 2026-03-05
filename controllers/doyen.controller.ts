// controllers/doyen.controller.ts

import { Request, Response } from "express";
import { pool } from "../db/pool";
import {
  mapDoyenRowToModel,
  DoyenRow,
} from "../models/doyen.model";
import {
  CreateDoyenInput,
  UpdateDoyenInput,
} from "../dto/doyen.dto";

/**
 * GET /doyens
 * Retourne tous les doyens
 */
export async function getDoyens(req: Request, res: Response) {
  try {
    const result = await pool.query<DoyenRow>(
      `SELECT id_doyen, id_faculte, id_user
       FROM doyen
       ORDER BY id_doyen`
    );

    const data = result.rows.map(mapDoyenRowToModel);
    return res.json(data);
  } catch (err) {
    console.error("Error getDoyens:", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des doyens." });
  }
}

/**
 * GET /doyens/:id
 */
export async function getDoyenById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const result = await pool.query<DoyenRow>(
      `SELECT id_doyen, id_faculte, id_user
       FROM doyen
       WHERE id_doyen = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Doyen introuvable." });
    }

    const doyen = mapDoyenRowToModel(result.rows[0]);
    return res.json(doyen);
  } catch (err) {
    console.error("Error getDoyenById:", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération du doyen." });
  }
}

/**
 * GET /doyens/user/:idUser
 * Récupérer un doyen selon son id_user
 */
export async function getDoyenByUser(req: Request, res: Response) {
  const { idUser } = req.params;

  try {
    const result = await pool.query<DoyenRow>(
      `SELECT id_doyen, id_faculte, id_user
       FROM doyen
       WHERE id_user = $1`,
      [idUser]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Aucun doyen trouvé pour cet utilisateur." });
    }

    const doyen = mapDoyenRowToModel(result.rows[0]);
    return res.json(doyen);
  } catch (err) {
    console.error("Error getDoyenByUser:", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération du doyen." });
  }
}

/**
 * POST /doyens
 */
export async function createDoyen(req: Request, res: Response) {
  const body = req.body as CreateDoyenInput;

  try {
    const result = await pool.query<DoyenRow>(
      `INSERT INTO doyen (id_faculte, id_user)
       VALUES ($1, $2)
       RETURNING id_doyen, id_faculte, id_user`,
      [body.idFaculte, body.idUser]
    );

    if (!result.rows[0]) {
      return res.status(400).json({ error: "Impossible de créer le doyen." });
    }

    const created = mapDoyenRowToModel(result.rows[0]);
    return res.status(201).json(created);
  } catch (err: any) {
    console.error("Error createDoyen:", err);

    // Contrainte unique par faculté ou par user
    if (err.code === "23505") {
      return res.status(400).json({
        error: "Cette faculté ou cet utilisateur a déjà un doyen associé.",
      });
    }

    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la création du doyen." });
  }
}

/**
 * PUT /doyens/:id
 */
export async function updateDoyen(req: Request, res: Response) {
  const { id } = req.params;
  const body = req.body as UpdateDoyenInput;

  if (!body.idFaculte && !body.idUser) {
    return res.status(400).json({
      error: "Aucune donnée à mettre à jour (idFaculte ou idUser requis).",
    });
  }

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (body.idFaculte) {
    fields.push(`id_faculte = $${idx++}`);
    values.push(body.idFaculte);
  }

  if (body.idUser) {
    fields.push(`id_user = $${idx++}`);
    values.push(body.idUser);
  }

  values.push(id);

  const query = `
    UPDATE doyen
       SET ${fields.join(", ")}
     WHERE id_doyen = $${idx}
     RETURNING id_doyen, id_faculte, id_user
  `;

  try {
    const result = await pool.query<DoyenRow>(query, values);

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Doyen introuvable." });
    }

    const updated = mapDoyenRowToModel(result.rows[0]);
    return res.json(updated);
  } catch (err: any) {
    console.error("Error updateDoyen:", err);

    if (err.code === "23505") {
      return res.status(400).json({
        error: "Cette faculté ou cet utilisateur a déjà un doyen associé.",
      });
    }

    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la mise à jour du doyen." });
  }
}

/**
 * DELETE /doyens/:id
 */
export async function deleteDoyen(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM doyen WHERE id_doyen = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Doyen introuvable." });
    }

    return res.json({ message: "Doyen supprimé avec succès." });
  } catch (err) {
    console.error("Error deleteDoyen:", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la suppression du doyen." });
  }
}