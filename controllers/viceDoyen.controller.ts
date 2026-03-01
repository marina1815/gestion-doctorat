// controllers/viceDoyen.controller.ts

import { Request, Response } from "express";
import { pool } from "../db/pool";
import {
  mapViceDoyenRowToModel,
  ViceDoyenRow,
} from "../models/viceDoyen.model";
import { CreateViceDoyenInput, UpdateViceDoyenInput } from "../dto/viceDoyen.dto";

/**
 * GET /vice-doyens
 * Retourne tous les vice-doyens
 */
export async function getViceDoyens(req: Request, res: Response) {
  try {
    const result = await pool.query<ViceDoyenRow>(
      `SELECT id_vice_doyen, id_faculte, id_user
       FROM vice_doyen
       ORDER BY id_vice_doyen`
    );

    const data = result.rows.map(mapViceDoyenRowToModel);
    return res.json(data);
  } catch (err) {
    console.error("Error getViceDoyens:", err);
    return res.status(500).json({ error: "Erreur serveur lors de la récupération des vice-doyens." });
  }
}


export async function getViceDoyenById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const result = await pool.query<ViceDoyenRow>(
      `SELECT id_vice_doyen, id_faculte, id_user
       FROM vice_doyen
       WHERE id_vice_doyen = $1`,
      [id]
    );

    if (!result.rows[0]){
       

      return res.status(404).json({ error: "Vice-doyen introuvable." });
    }
    
    const viceDoyen = mapViceDoyenRowToModel(result.rows[0]);
    return res.json(viceDoyen);
  } catch (err) {
    console.error("Error getViceDoyenById:", err);
    return res.status(500).json({ error: "Erreur serveur lors de la récupération du vice-doyen." });
  }
}

/**
 * POST /vice-doyens
 */
export async function createViceDoyen(req: Request, res: Response) {
  const body = req.body as CreateViceDoyenInput;

  try {
    const result = await pool.query<ViceDoyenRow>(
      `INSERT INTO vice_doyen (id_faculte, id_user)
       VALUES ($1, $2)
       RETURNING id_vice_doyen, id_faculte, id_user`,
      [body.idFaculte, body.idUser]
    );
    if (!result.rows[0]){
        return res.status(404).json({ error: "Imossiple de cree." });
    }

    const created = mapViceDoyenRowToModel(result.rows[0]);
    return res.status(201).json(created);
  } catch (err: any) {
    console.error("Error createViceDoyen:", err);

    if (err.code === "23505") {
      return res.status(400).json({
        error: "Cette faculté a déjà un vice-doyen associé.",
      });
    }

    return res.status(500).json({ error: "Erreur serveur lors de la création du vice-doyen." });
  }
}

/**
 * PUT /vice-doyens/:id
 */
export async function updateViceDoyen(req: Request, res: Response) {
  const { id } = req.params;
  const body = req.body as UpdateViceDoyenInput;

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
    UPDATE vice_doyen
       SET ${fields.join(", ")}
     WHERE id_vice_doyen = $${idx}
     RETURNING id_vice_doyen, id_faculte, id_user
  `;

  try {
    const result = await pool.query<ViceDoyenRow>(query, values);

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Vice-doyen introuvable." });
    }
    
    const updated = mapViceDoyenRowToModel(result.rows[0]);
    return res.json(updated);
  } catch (err: any) {
    console.error("Error updateViceDoyen:", err);

    if (err.code === "23505") {
      return res.status(400).json({
        error: "Cette faculté a déjà un vice-doyen associé.",
      });
    }

    return res.status(500).json({ error: "Erreur serveur lors de la mise à jour du vice-doyen." });
  }
}

/**
 * DELETE /vice-doyens/:id
 */
export async function deleteViceDoyen(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM vice_doyen WHERE id_vice_doyen = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Vice-doyen introuvable." });
    }

    return res.json({ message: "Vice-doyen supprimé avec succès." });
  } catch (err) {
    console.error("Error deleteViceDoyen:", err);
    return res.status(500).json({ error: "Erreur serveur lors de la suppression du vice-doyen." });
  }
}