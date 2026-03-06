
import { Router } from "express";
import {
  createResponsableSalle,
  getAllResponsablesSalle,
  getResponsablesSalleByConcours,
  getResponsablesSalleBySalle,
  deleteResponsableSalle,
} from "../controllers/responsable-salle.controller";

const router = Router();

router.post("/", createResponsableSalle);
router.get("/", getAllResponsablesSalle);
router.get("/concours/:idConcours", getResponsablesSalleByConcours);
router.get("/salle/:idSalle", getResponsablesSalleBySalle);
router.delete("/:idResponsableSalle", deleteResponsableSalle);

export default router;