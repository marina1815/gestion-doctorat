import { Request, Response } from "express";
import { pool } from "../db/pool";
import {
  CelluleAnonymatRow,
  CelluleAnonymat,
  mapCelluleAnonymatRowToModel,
} from "../models/celluleAnonymat.model";

/**
 * GET /api/cellules-anonymat
 */
export async function getCellulesAnonymat(req: Request, res: Response) {
  try {
    const result = await pool.query<CelluleAnonymatRow>(`
      SELECT *
      FROM cellule_anonymat
      ORDER BY id_concours, id_user
    `);

    const items: CelluleAnonymat[] = result.rows.map(mapCelluleAnonymatRowToModel);
    return res.json(items);
  } catch (err) {
    console.error("Error getCellulesAnonymat:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function getCelluleAnonymatById(req: Request, res: Response) {
  try {
    const { idCelluleAnonymat } = req.params;

    const result = await pool.query<CelluleAnonymatRow>(
      `
      SELECT *
      FROM cellule_anonymat
      WHERE id_cellule_anonymat = $1
      `,
      [idCelluleAnonymat]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Cellule anonymat introuvable" });
    }

    const item = mapCelluleAnonymatRowToModel(result.rows[0]);
    return res.json(item);
  } catch (err) {
    console.error("Error getCelluleAnonymatById:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function getCellulesAnonymatByConcours(req: Request, res: Response) {
  try {
    const { idConcours } = req.params;

    const result = await pool.query<CelluleAnonymatRow>(
      `
      SELECT *
      FROM cellule_anonymat
      WHERE id_concours = $1
      ORDER BY id_user
      `,
      [idConcours]
    );

    const items: CelluleAnonymat[] = result.rows.map(mapCelluleAnonymatRowToModel);
    return res.json(items);
  } catch (err) {
    console.error("Error getCellulesAnonymatByConcours:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function createCelluleAnonymat(req: Request, res: Response) {
  try {
    const { idConcours, idUser } = req.body as {
      idConcours: string;
      idUser: string;
    };

    const result = await pool.query<CelluleAnonymatRow>(
      `
      INSERT INTO cellule_anonymat (id_concours, id_user)
      VALUES ($1, $2)
      RETURNING *
      `,
      [idConcours, idUser]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Cellule anonymat introuvable" });
    }

    const item = mapCelluleAnonymatRowToModel(result.rows[0]);
    return res.status(201).json(item);
  } catch (err: any) {
    console.error("Error createCelluleAnonymat:", err);

    // Doublon (si tu as UNIQUE(id_concours, id_user))
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: "Cet utilisateur est déjà dans la cellule d’anonymat de ce concours." });
    }

    return res.status(500).json({ error: "Erreur serveur" });
  }
}

/**
 * PUT /api/cellules-anonymat/:idCelluleAnonymat
 */
export async function updateCelluleAnonymat(req: Request, res: Response) {
  try {
    const { idCelluleAnonymat } = req.params;
    const { idConcours, idUser } = req.body as {
      idConcours?: string;
      idUser?: string;
    };

    const existing = await pool.query<CelluleAnonymatRow>(
      `SELECT * FROM cellule_anonymat WHERE id_cellule_anonymat = $1`,
      [idCelluleAnonymat]
    );

    if (!existing.rows[0]) {
      return res.status(404).json({ error: "Cellule anonymat introuvable" });
    }

    const current = existing.rows[0];

    const newIdConcours = idConcours ?? current.id_concours;
    const newIdUser = idUser ?? current.id_user;

    const result = await pool.query<CelluleAnonymatRow>(
      `
      UPDATE cellule_anonymat
      SET id_concours = $1,
          id_user = $2
      WHERE id_cellule_anonymat = $3
      RETURNING *
      `,
      [newIdConcours, newIdUser, idCelluleAnonymat]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Cellule anonymat introuvable" });
    }

    const item = mapCelluleAnonymatRowToModel(result.rows[0]);
    return res.json(item);
  } catch (err: any) {
    console.error("Error updateCelluleAnonymat:", err);

    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: "Cet utilisateur est déjà dans la cellule d’anonymat de ce concours." });
    }

    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function deleteCelluleAnonymat(req: Request, res: Response) {
  try {
    const { idCelluleAnonymat } = req.params;

    const result = await pool.query(
      `
      DELETE FROM cellule_anonymat
      WHERE id_cellule_anonymat = $1
      `,
      [idCelluleAnonymat]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Cellule anonymat introuvable" });
    }

    return res.json({ message: "Cellule anonymat supprimée avec succès" });
  } catch (err) {
    console.error("Error deleteCelluleAnonymat:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}