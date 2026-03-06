
import { Router } from "express";
import {
  createSalle,
  getAllSalles,
  getSalleById,
  updateSalle,
  deleteSalle,
} from "../controllers/salle.controller";

const router = Router();

router.post("/", createSalle);
router.get("/", getAllSalles);
router.get("/:idSalle", getSalleById);
router.put("/:idSalle", updateSalle);
router.delete("/:idSalle", deleteSalle);

export default router;