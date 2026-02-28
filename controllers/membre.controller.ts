import { Request, Response } from "express";
import { pool } from "../db/pool";
import { mapMembreRowToModel, Membre } from "../models/membre.model";



export async function getMembres(req: Request, res: Response) {
    try {
        const result = await pool.query(`SELECT * FROM membres ORDER BY nom_membre`);

        const membres: Membre[] = result.rows.map((row) =>
            mapMembreRowToModel(row)
        );

        return res.json(membres);
    } catch (err) {
        console.error("Error getMembres:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

// ===========================
// GET MEMBRE BY ID
// ===========================
export async function getMembreById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM membres WHERE id_membre = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Membre introuvable" });
        }

        const membre = mapMembreRowToModel(result.rows[0]);
        return res.json(membre);
    } catch (err) {
        console.error("Error getMembreById:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}


export async function createMembre(req: Request, res: Response) {
    try {
        const { nomMembre, prenomMembre, nomAr, prenomAr, grade, sexe } = req.body;

        const result = await pool.query(
            `INSERT INTO membres 
      (nom_membre, prenom_membre, nom_ar, prenom_ar, grade, sexe)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
            [nomMembre, prenomMembre, nomAr, prenomAr, grade, sexe]
        );

        const membre = mapMembreRowToModel(result.rows[0]);

        return res.status(201).json(membre);
    } catch (err) {
        console.error("Error createMembre:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

// ===========================
// UPDATE MEMBRE
// ===========================
export async function updateMembre(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { nomMembre, prenomMembre, nomAr, prenomAr, grade, sexe } = req.body;

        const result = await pool.query(
            `UPDATE membres SET 
        nom_membre = $1,
        prenom_membre = $2,
        nom_ar = $3,
        prenom_ar = $4,
        grade = $5,
        sexe = $6
      WHERE id_membre = $7
      RETURNING *`,
            [nomMembre, prenomMembre, nomAr, prenomAr, grade, sexe, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Membre introuvable" });
        }

        const membre = mapMembreRowToModel(result.rows[0]);
        return res.json(membre);
    } catch (err) {
        console.error("Error updateMembre:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

// ===========================
// DELETE MEMBRE
// ===========================
export async function deleteMembre(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM membres WHERE id_membre = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Membre introuvable" });
        }

        return res.json({ message: "Membre supprimé avec succès" });
    } catch (err) {
        console.error("Error deleteMembre:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}