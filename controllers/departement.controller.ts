import { Request, Response } from "express";
import { pool } from "../db/pool";
import {
    CreateDepartementInput,
    UpdateDepartementInput,
} from "../dto/departement.dto";
import {
    DepartementRow,
    Departement,
    mapDepartementRowToModel,
} from "../models/departement.model";

// ========================
// CREATE
// ========================
export async function createDepartement(req: Request, res: Response) {
    try {
        const { nomDepartement, idFaculte } = req.body as CreateDepartementInput;

        const result = await pool.query<DepartementRow>(
            `
      INSERT INTO departement (
        nom_departement,
        id_faculte
      )
      VALUES ($1, $2)
      RETURNING *
      `,
            [nomDepartement, idFaculte]
        );

        const row = result.rows[0];
        if (!row) {
            return res
                .status(500)
                .json({ error: "Aucune ligne retournée lors de la création du département" });
        }

        const departement: Departement = mapDepartementRowToModel(row);

        return res.status(201).json({
            message: "Département créé avec succès",
            departement,
        });
    } catch (err) {
        console.error("Error createDepartement:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

// ========================
// GET ALL
// ========================
export async function getDepartements(req: Request, res: Response) {
    try {
        const result = await pool.query<DepartementRow>(
            `
      SELECT *
      FROM departement
      ORDER BY nom_departement ASC
      `
        );

        const departements: Departement[] = result.rows.map(mapDepartementRowToModel);
        return res.json(departements);
    } catch (err) {
        console.error("Error getDepartements:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

// ========================
// GET BY ID
// ========================
export async function getDepartementById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const result = await pool.query<DepartementRow>(
            `
      SELECT *
      FROM departement
      WHERE id_departement = $1
      `,
            [id]
        );

        const row = result.rows[0];
        if (!row) {
            return res.status(404).json({ error: "Département non trouvé" });
        }

        const departement: Departement = mapDepartementRowToModel(row);
        return res.json(departement);
    } catch (err) {
        console.error("Error getDepartementById:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

// ========================
// GET BY FACULTE
// ========================
export async function getDepartementsByFaculte(req: Request, res: Response) {
    try {
        const { idFaculte } = req.params;

        const result = await pool.query<DepartementRow>(
            `
      SELECT *
      FROM departement
      WHERE id_faculte = $1
      ORDER BY nom_departement ASC
      `,
            [idFaculte]
        );

        const departements: Departement[] = result.rows.map(mapDepartementRowToModel);
        return res.json(departements);
    } catch (err) {
        console.error("Error getDepartementsByFaculte:", err);
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

// ========================
// UPDATE
// ========================
export async function updateDepartement(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { nomDepartement, idFaculte } = req.body as UpdateDepartementInput;

        const existing = await pool.query<DepartementRow>(
            `SELECT * FROM departement WHERE id_departement = $1`,
            [id]
        );

        const current = existing.rows[0];
        if (!current) {
            return res.status(404).json({ error: "Département non trouvé" });
        }

        const newNom = nomDepartement ?? current.nom_departement;
        const newIdFaculte = idFaculte ?? current.id_faculte;

        const result = await pool.query<DepartementRow>(
            `
      UPDATE departement
      SET nom_departement = $1,
          id_faculte = $2
      WHERE id_departement = $3
      RETURNING *
      `,
            [newNom, newIdFaculte, id]
        );

        const row = result.rows[0];
        if (!row) {
            return res
                .status(500)
                .json({ error: "Aucune ligne retournée lors de la mise à jour" });
        }

        const departement: Departement = mapDepartementRowToModel(row);

        return res.json({
            message: "Département mis à jour avec succès",
            departement,
        });
    } catch (err) {
        console.error("Error updateDepartement:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

// ========================
// DELETE
// ========================
export async function deleteDepartement(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
      DELETE FROM departement
      WHERE id_departement = $1
      `,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Département non trouvé" });
        }

        return res.json({ message: "Département supprimé avec succès" });
    } catch (err) {
        console.error("Error deleteDepartement:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}