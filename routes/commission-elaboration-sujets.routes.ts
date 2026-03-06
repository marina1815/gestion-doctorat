
import { Router } from "express";
import {
  createCommissionElaborationSujets,
  getAllCommissionElaborationSujets,
  getCommissionElaborationSujetsByConcours,
  deleteCommissionElaborationSujets,
} from "../controllers/commission-elaboration-sujets.controller";

const router = Router();

router.post("/", createCommissionElaborationSujets);
router.get("/", getAllCommissionElaborationSujets);
router.get("/concours/:idConcours", getCommissionElaborationSujetsByConcours);
router.delete("/:idCommission", deleteCommissionElaborationSujets);

export default router;