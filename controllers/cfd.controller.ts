// src/controllers/cfd.controller.ts
import { Request, Response } from "express";
import { pool } from "../db/pool";
import { CfdRow, Cfd, mapCfdRowToModel } from "../models/cfd.model";

/**
 * GET /api/cfds
 */
export async function getCfds(req: Request, res: Response) {
  try {
    const result = await pool.query<CfdRow>(`
      SELECT *
      FROM cfd
      ORDER BY id_concours, id_user
    `);

    const cfds: Cfd[] = result.rows.map(mapCfdRowToModel);
    return res.json(cfds);
  } catch (err) {
    console.error("Error getCfds:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}


export async function getCfdById(req: Request, res: Response) {
  try {
    const { idCfd } = req.params;

    const result = await pool.query<CfdRow>(
      `
      SELECT *
      FROM cfd
      WHERE id_cfd = $1
      `,
      [idCfd]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "CFD introuvable" });
    }

    const cfd = mapCfdRowToModel(result.rows[0]);
    return res.json(cfd);
  } catch (err) {
    console.error("Error getCfdById:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}


export async function getCfdsByConcours(req: Request, res: Response) {
  try {
    const { idConcours } = req.params;

    const result = await pool.query<CfdRow>(
      `
      SELECT *
      FROM cfd
      WHERE id_concours = $1
      ORDER BY id_user
      `,
      [idConcours]
    );

    const cfds: Cfd[] = result.rows.map(mapCfdRowToModel);
    return res.json(cfds);
  } catch (err) {
    console.error("Error getCfdsByConcours:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}


export async function createCfd(req: Request, res: Response) {
  try {
    const { idConcours, idUser } = req.body as {
      idConcours: string;
      idUser: string;
    };

    const result = await pool.query<CfdRow>(
      `
      INSERT INTO cfd (id_concours, id_user)
      VALUES ($1, $2)
      RETURNING *
      `,
      [idConcours, idUser]
    );
     if (!result.rows[0]) {
      return res.status(404).json({ error: "CFD introuvable" });
    }

    const cfd = mapCfdRowToModel(result.rows[0]);
    return res.status(201).json(cfd);
  } catch (err: any) {
    console.error("Error createCfd:", err);

 
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: "Ce membre est déjà dans la CFD de ce concours." });
    }

    return res.status(500).json({ error: "Erreur serveur" });
  }
}

/**
 * PUT /api/cfds/:idCfd
 */
export async function updateCfd(req: Request, res: Response) {
  try {
    const { idCfd } = req.params;
    const { idConcours, idUser } = req.body as {
      idConcours?: string;
      idUser?: string;
    };

    
    const existing = await pool.query<CfdRow>(
      `SELECT * FROM cfd WHERE id_cfd = $1`,
      [idCfd]
    );

    if (!existing.rows[0]) {
      return res.status(404).json({ error: "CFD introuvable" });
    }

    const current = existing.rows[0];

    const newIdConcours = idConcours ?? current.id_concours;
    const newIdUser = idUser ?? current.id_user;

    const result = await pool.query<CfdRow>(
      `
      UPDATE cfd
      SET id_concours = $1,
          id_user = $2
      WHERE id_cfd = $3
      RETURNING *
      `,
      [newIdConcours, newIdUser, idCfd]
    );
    if(!result.rows[0]){
        return res.status(404).json({ error: "CFD introuvable" }); 
    }

    const cfd = mapCfdRowToModel(result.rows[0]);
    return res.json(cfd);
  } catch (err) {
    console.error("Error updateCfd:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}


export async function deleteCfd(req: Request, res: Response) {
  try {
    const { idCfd } = req.params;

    const result = await pool.query(
      `
      DELETE FROM cfd
      WHERE id_cfd = $1
      `,
      [idCfd]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "CFD introuvable" });
    }

    return res.json({ message: "CFD supprimée avec succès" });
  } catch (err) {
    console.error("Error deleteCfd:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}