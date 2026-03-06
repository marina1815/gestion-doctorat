// commission-elaboration-sujets.controller.ts

import { Request, Response } from "express";
import { pool } from "../db/pool";
import {
  CommissionElaborationSujetsRow,
  mapCommissionElaborationSujetsRowToModel,
} from "../models/commission-elaboration-sujets.model";
import { CreateCommissionElaborationSujetsDto } from "../dto/commission-elaboration-sujets.dto";

export async function createCommissionElaborationSujets(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { idConcours, idMembre, idSpecialite } =
      req.body as CreateCommissionElaborationSujetsDto;

    if (!idConcours || !idMembre || !idSpecialite) {
      res.status(400).json({
        message: "idConcours, idMembre et idSpecialite sont obligatoires",
      });
      return;
    }

    const query = `
      INSERT INTO commission_elaboration_sujets (
        id_concours,
        id_membre,
        id_specialite
      )
      VALUES ($1, $2, $3)
      RETURNING
        id_commission,
        id_concours,
        id_membre,
        id_specialite
    `;

    const values = [idConcours, idMembre, idSpecialite];

    const result = await pool.query<CommissionElaborationSujetsRow>(query, values);
    if (!result.rows[0]){
        return ;
    }
    const commission = mapCommissionElaborationSujetsRowToModel(result.rows[0]);

    res.status(201).json({
      message: "Membre ajouté à la commission d’élaboration des sujets avec succès",
      commission,
    });
  } catch (error: any) {
    if (error.code === "23505") {
      res.status(409).json({
        message: "Ce membre existe déjà dans cette commission",
      });
      return;
    }

    console.error("Erreur createCommissionElaborationSujets:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la création",
      error: error.message,
    });
  }
}

export async function getAllCommissionElaborationSujets(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const query = `
      SELECT
        id_commission,
        id_concours,
        id_membre,
        id_specialite
      FROM commission_elaboration_sujets
      ORDER BY id_commission DESC
    `;

    const result = await pool.query<CommissionElaborationSujetsRow>(query);

    const commissions = result.rows.map(mapCommissionElaborationSujetsRowToModel);

    res.status(200).json(commissions);
  } catch (error: any) {
    console.error("Erreur getAllCommissionElaborationSujets:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération",
      error: error.message,
    });
  }
}

export async function getCommissionElaborationSujetsByConcours(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { idConcours } = req.params;

    const query = `
      SELECT
        id_commission,
        id_concours,
        id_membre,
        id_specialite
      FROM commission_elaboration_sujets
      WHERE id_concours = $1
      ORDER BY id_commission DESC
    `;

    const result = await pool.query<CommissionElaborationSujetsRow>(query, [idConcours]);

    const commissions = result.rows.map(mapCommissionElaborationSujetsRowToModel);

    res.status(200).json(commissions);
  } catch (error: any) {
    console.error("Erreur getCommissionElaborationSujetsByConcours:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération par concours",
      error: error.message,
    });
  }
}

export async function deleteCommissionElaborationSujets(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { idCommission } = req.params;

    const query = `
      DELETE FROM commission_elaboration_sujets
      WHERE id_commission = $1
      RETURNING
        id_commission,
        id_concours,
        id_membre,
        id_specialite
    `;

    const result = await pool.query<CommissionElaborationSujetsRow>(query, [idCommission]);

    if (!result.rows[0]) {
      res.status(404).json({
        message: "Entrée commission introuvable",
      });
      return;
    }

    const deletedCommission = mapCommissionElaborationSujetsRowToModel(result.rows[0]);

    res.status(200).json({
      message: "Membre supprimé de la commission avec succès",
      commission: deletedCommission,
    });
  } catch (error: any) {
    console.error("Erreur deleteCommissionElaborationSujets:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la suppression",
      error: error.message,
    });
  }
}