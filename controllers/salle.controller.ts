// salle.controller.ts

import { Request, Response } from "express";
import { pool } from "../db/pool";
import { CreateSalleDto, UpdateSalleDto } from "../dto/salle.dto";
import { SalleRow, mapSalleRowToModel } from "../models/salle.model";

export async function createSalle(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { nomSalle, capaciteSalle } = req.body as CreateSalleDto;

    if (!nomSalle || capaciteSalle === undefined || capaciteSalle === null) {
      res.status(400).json({
        message: "nomSalle et capaciteSalle sont obligatoires",
      });
      return;
    }

    const query = `
      INSERT INTO salle (
        nom_salle,
        capacite_salle
      )
      VALUES ($1, $2)
      RETURNING
        id_salle,
        nom_salle,
        capacite_salle
    `;

    const values = [nomSalle, capaciteSalle];
    const result = await pool.query<SalleRow>(query, values);
    if (result.rows[0] === undefined) {
      res.status(404).json({
        message: "Salle introuvable",
      });
      return;
    }

    const salle = mapSalleRowToModel(result.rows[0]);

    res.status(201).json({
      message: "Salle créée avec succès",
      salle,
    });
  } catch (error: any) {
    console.error("Erreur createSalle:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la création de la salle",
      error: error.message,
    });
  }
}

export async function getAllSalles(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const query = `
      SELECT
        id_salle,
        nom_salle,
        capacite_salle
      FROM salle
      ORDER BY nom_salle ASC
    `;

    const result = await pool.query<SalleRow>(query);
    const salles = result.rows.map(mapSalleRowToModel);

    res.status(200).json(salles);
  } catch (error: any) {
    console.error("Erreur getAllSalles:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des salles",
      error: error.message,
    });
  }
}

export async function getSalleById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { idSalle } = req.params;

    const query = `
      SELECT
        id_salle,
        nom_salle,
        capacite_salle
      FROM salle
      WHERE id_salle = $1
    `;

    const result = await pool.query<SalleRow>(query, [idSalle]);

    if (result.rowCount === 0) {
      res.status(404).json({
        message: "Salle introuvable",
      });
      return;
    }
    if (result.rows[0] === undefined) {
      res.status(404).json({
        message: "Salle introuvable",
      });
      return;
    }

    const salle = mapSalleRowToModel(result.rows[0]);

    res.status(200).json(salle);
  } catch (error: any) {
    console.error("Erreur getSalleById:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération de la salle",
      error: error.message,
    });
  }
}

export async function updateSalle(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { idSalle } = req.params;
    const { nomSalle, capaciteSalle } = req.body as UpdateSalleDto;

    const query = `
      UPDATE salle
      SET
        nom_salle = COALESCE($1, nom_salle),
        capacite_salle = COALESCE($2, capacite_salle)
      WHERE id_salle = $3
      RETURNING
        id_salle,
        nom_salle,
        capacite_salle
    `;

    const values = [nomSalle ?? null, capaciteSalle ?? null, idSalle];
    const result = await pool.query<SalleRow>(query, values);

    if (result.rowCount === 0) {
      res.status(404).json({
        message: "Salle introuvable",
      });
      return;
    }
    if (result.rows[0] === undefined) {
      res.status(404).json({
        message: "Salle introuvable",
      });
      return;
    }

    const salle = mapSalleRowToModel(result.rows[0]);

    res.status(200).json({
      message: "Salle mise à jour avec succès",
      salle,
    });
  } catch (error: any) {
    console.error("Erreur updateSalle:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la mise à jour de la salle",
      error: error.message,
    });
  }
}

export async function deleteSalle(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { idSalle } = req.params;

    const query = `
      DELETE FROM salle
      WHERE id_salle = $1
      RETURNING
        id_salle,
        nom_salle,
        capacite_salle
    `;

    const result = await pool.query<SalleRow>(query, [idSalle]);

    if (result.rowCount === 0) {
      res.status(404).json({
        message: "Salle introuvable",
      });
      return;
    }
    if (result.rows[0] === undefined) {
      res.status(404).json({
        message: "Salle introuvable",
      });
      return;
    }

    const salle = mapSalleRowToModel(result.rows[0]);

    res.status(200).json({
      message: "Salle supprimée avec succès",
      salle,
    });
  } catch (error: any) {
    console.error("Erreur deleteSalle:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la suppression de la salle",
      error: error.message,
    });
  }
}