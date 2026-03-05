// src/routes/correcteur.routes.ts
import { Router } from "express";
import {
  getCorrecteurs,
  getCorrecteurById,
  getCorrecteursByConcours,
  createCorrecteur,
  updateCorrecteur,
  deleteCorrecteur,
} from "../controllers/correcteur.controller";

const router = Router();


router.get("/", getCorrecteurs);
router.get("/concours/:idConcours", getCorrecteursByConcours);
router.get("/:idCorrecteur", getCorrecteurById);

router.post("/", createCorrecteur);
router.put("/:idCorrecteur", updateCorrecteur);
router.delete("/:idCorrecteur", deleteCorrecteur);

export default router;