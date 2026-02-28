import { Request, Response } from "express";
import { pool } from "../db/pool";
import {
    CreateSpecialiteInput,
    UpdateSpecialiteInput,
} from "../dto/specialite.dto";
import {
    SpecialiteRow,
    Specialite,
    mapSpecialiteRowToModel,
} from "../models/specialite.model";

// ========================
// CREATE
// ========================
export async function createSpecialite(req: Request, res: Response) {
    try {
        const { filiere, nomSpecialite, nombrePlaces, idConcours } =
            req.body as CreateSpecialiteInput;

        const result = await pool.query<SpecialiteRow>(
            `
      INSERT INTO specialite (
        filiere,
        nom_specialite,
        nombre_places,
        id_concours
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
            [filiere, nomSpecialite, nombrePlaces, idConcours]
        );

        const row = result.rows[0];
        if (!row) {
            return res
                .status(500)
                .json({ error: "Aucune ligne retournée lors de la création de la spécialité" });
        }

        const specialite: Specialite = mapSpecialiteRowToModel(row);

        return res.status(201).json({
            message: "Spécialité créée avec succès",
            specialite,
        });
    } catch (err) {
        console.error("Error createSpecialite:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

// ========================
// GET ALL
// ========================
export async function getSpecialites(req: Request, res: Response) {
    try {
        const result = await pool.query<SpecialiteRow>(
            `
      SELECT *
      FROM specialite
      ORDER BY filiere ASC, nom_specialite ASC
      `
        );

        const specialites: Specialite[] = result.rows.map(mapSpecialiteRowToModel);
        return res.json(specialites);
    } catch (err) {
        console.error("Error getSpecialites:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

// ========================
// GET BY ID
// ========================
export async function getSpecialiteById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const result = await pool.query<SpecialiteRow>(
            `
      SELECT *
      FROM specialite
      WHERE id_specialite = $1
      `,
            [id]
        );

        const row = result.rows[0];
        if (!row) {
            return res.status(404).json({ error: "Spécialité non trouvée" });
        }

        const specialite: Specialite = mapSpecialiteRowToModel(row);
        return res.json(specialite);
    } catch (err) {
        console.error("Error getSpecialiteById:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

// ========================
// GET BY CONCOURS
// ========================
export async function getSpecialitesByConcours(req: Request, res: Response) {
    try {
        const { idConcours } = req.params;

        const result = await pool.query<SpecialiteRow>(
            `
      SELECT *
      FROM specialite
      WHERE id_concours = $1
      ORDER BY filiere ASC, nom_specialite ASC
      `,
            [idConcours]
        );

        const specialites: Specialite[] = result.rows.map(mapSpecialiteRowToModel);
        return res.json(specialites);
    } catch (err) {
        console.error("Error getSpecialitesByConcours:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}
export async function getFiliereByConcour(req: Request, res: Response) {
    try {
        const { idConcours } = req.params;

        

        const result = await pool.query<{ filiere: string }>(
            `
      SELECT filiere
      FROM specialite
      WHERE id_concours = $1
      `,
            [idConcours]
        );



        const row = result.rows[0];


        return res.json({
            row
        });

    } catch (err) {
        console.error("Error getFilieresByConcours:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}


export async function getNombrePlacesSpecialitesByConcours(req: Request, res: Response) {
    try {
        const { idConcours } = req.params;

        const result = await pool.query<SpecialiteRow>(
            `
      SELECT SUM(nombre_places)
      FROM specialite
      WHERE id_concours = $1
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
        console.error("Error getSpecialitesByConcours:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}


// ========================
// UPDATE
// ========================
export async function updateSpecialite(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { filiere, nomSpecialite, nombrePlaces, idConcours } =
            req.body as UpdateSpecialiteInput;

        const existing = await pool.query<SpecialiteRow>(
            `SELECT * FROM specialite WHERE id_specialite = $1`,
            [id]
        );

        const current = existing.rows[0];
        if (!current) {
            return res.status(404).json({ error: "Spécialité non trouvée" });
        }

        const newFiliere = filiere ?? current.filiere;
        const newNom = nomSpecialite ?? current.nom_specialite;
        const newPlaces = nombrePlaces ?? current.nombre_places;
        const newIdConcours = idConcours ?? current.id_concours;

        const result = await pool.query<SpecialiteRow>(
            `
      UPDATE specialite
      SET filiere = $1,
          nom_specialite = $2,
          nombre_places = $3,
          id_concours = $4
      WHERE id_specialite = $5
      RETURNING *
      `,
            [newFiliere, newNom, newPlaces, newIdConcours, id]
        );

        const row = result.rows[0];
        if (!row) {
            return res
                .status(500)
                .json({ error: "Aucune ligne retournée lors de la mise à jour" });
        }

        const specialite: Specialite = mapSpecialiteRowToModel(row);

        return res.json({
            message: "Spécialité mise à jour avec succès",
            specialite,
        });
    } catch (err) {
        console.error("Error updateSpecialite:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

// ========================
// DELETE
// ========================
export async function deleteSpecialite(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
      DELETE FROM specialite
      WHERE id_specialite = $1
      `,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Spécialité non trouvée" });
        }

        return res.json({ message: "Spécialité supprimée avec succès" });
    } catch (err) {
        console.error("Error deleteSpecialite:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}