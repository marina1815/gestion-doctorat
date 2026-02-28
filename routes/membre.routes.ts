import { Router } from "express";
import {
  getMembres,
  getMembreById,
  createMembre,
  updateMembre,
  deleteMembre,
} from "../controllers/membre.controller";

const router = Router();

router.get("/", getMembres);
router.get("/:id", getMembreById);
router.post("/", createMembre);
router.put("/:id", updateMembre);
router.delete("/:id", deleteMembre);

export default router;