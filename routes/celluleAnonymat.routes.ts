
import { Router } from "express";
import {
  getCellulesAnonymat,
  getCelluleAnonymatById,
  getCellulesAnonymatByConcours,
  createCelluleAnonymat,
  updateCelluleAnonymat,
  deleteCelluleAnonymat,
} from "../controllers/celluleAnonymat.controller";

const router = Router();


router.get("/", getCellulesAnonymat);
router.get("/concours/:idConcours", getCellulesAnonymatByConcours);
router.get("/:idCelluleAnonymat", getCelluleAnonymatById);

router.post("/", createCelluleAnonymat);
router.put("/:idCelluleAnonymat", updateCelluleAnonymat);
router.delete("/:idCelluleAnonymat", deleteCelluleAnonymat);

export default router;