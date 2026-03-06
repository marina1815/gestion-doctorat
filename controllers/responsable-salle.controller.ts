// responsable-salle.controller.ts

import { Request, Response } from "express";
import { pool } from "../db/pool";
import {
  ResponsableSalleRow,
  mapResponsableSalleRowToModel,
} from "../models/responsable-salle.model";
import { CreateResponsableSalleDto } from "../dto/responsable-salle.dto";

export async function createResponsableSalle(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { idConcours, idMembre, idSalle } =
      req.body as CreateResponsableSalleDto;

    if (!idConcours || !idMembre || !idSalle) {
      res.status(400).json({
        message: "idConcours, idMembre et idSalle sont obligatoires",
      });
      return;
    }

    const query = `
      INSERT INTO responsable_salle (
        id_concours,
        id_membre,
        id_salle
      )
      VALUES ($1, $2, $3)
      RETURNING
        id_responsable_salle,
        id_concours,
        id_membre,
        id_salle
    `;

    const values = [idConcours, idMembre, idSalle];

    const result = await pool.query<ResponsableSalleRow>(query, values);
    if (result.rows[0] === undefined) {
      res.status(404).json({
        message: "Responsable de salle introuvable",
      });
      return;
    }
    const responsableSalle = mapResponsableSalleRowToModel(result.rows[0]);

    res.status(201).json({
      message: "Responsable de salle créé avec succès",
      responsableSalle,
    });
  } catch (error: any) {
    if (error.code === "23505") {
      res.status(409).json({
        message: "Ce membre est déjà affecté comme responsable de salle",
      });
      return;
    }

    console.error("Erreur createResponsableSalle:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la création",
      error: error.message,
    });
  }
}

export async function getAllResponsablesSalle(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const query = `
      SELECT
        id_responsable_salle,
        id_concours,
        id_membre,
        id_salle
      FROM responsable_salle
      ORDER BY id_responsable_salle DESC
    `;

    const result = await pool.query<ResponsableSalleRow>(query);
    const responsablesSalle = result.rows.map(mapResponsableSalleRowToModel);

    res.status(200).json(responsablesSalle);
  } catch (error: any) {
    console.error("Erreur getAllResponsablesSalle:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération",
      error: error.message,
    });
  }
}

export async function getResponsablesSalleByConcours(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { idConcours } = req.params;

    const query = `
      SELECT
        id_responsable_salle,
        id_concours,
        id_membre,
        id_salle
      FROM responsable_salle
      WHERE id_concours = $1
      ORDER BY id_responsable_salle DESC
    `;

    const result = await pool.query<ResponsableSalleRow>(query, [idConcours]);
    const responsablesSalle = result.rows.map(mapResponsableSalleRowToModel);

    res.status(200).json(responsablesSalle);
  } catch (error: any) {
    console.error("Erreur getResponsablesSalleByConcours:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération par concours",
      error: error.message,
    });
  }
}

export async function getResponsablesSalleBySalle(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { idSalle } = req.params;

    const query = `
      SELECT
        id_responsable_salle,
        id_concours,
        id_membre,
        id_salle
      FROM responsable_salle
      WHERE id_salle = $1
      ORDER BY id_responsable_salle DESC
    `;

    const result = await pool.query<ResponsableSalleRow>(query, [idSalle]);
    const responsablesSalle = result.rows.map(mapResponsableSalleRowToModel);

    res.status(200).json(responsablesSalle);
  } catch (error: any) {
    console.error("Erreur getResponsablesSalleBySalle:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération par salle",
      error: error.message,
    });
  }
}

export async function deleteResponsableSalle(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { idResponsableSalle } = req.params;

    const query = `
      DELETE FROM responsable_salle
      WHERE id_responsable_salle = $1
      RETURNING
        id_responsable_salle,
        id_concours,
        id_membre,
        id_salle
    `;

    const result = await pool.query<ResponsableSalleRow>(query, [
      idResponsableSalle,
    ]);

    if (result.rows[0] === undefined) {
      res.status(404).json({
        message: "Responsable de salle introuvable",
      });
      return;
    }

    const deletedResponsableSalle = mapResponsableSalleRowToModel(result.rows[0]);

    res.status(200).json({
      message: "Responsable de salle supprimé avec succès",
      responsableSalle: deletedResponsableSalle,
    });
  } catch (error: any) {
    console.error("Erreur deleteResponsableSalle:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la suppression",
      error: error.message,
    });
  }
}