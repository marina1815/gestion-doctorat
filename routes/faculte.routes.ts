import { Router } from "express";
import {
  getFacultes,
  getFaculteById,
  createFaculte,
  updateFaculte,
  deleteFaculte,
} from "../controllers/faculte.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate";
import {
  createFaculteSchema,
  updateFaculteSchema,
  faculteIdParamSchema,
} from "../dto/faculte.dto";

const router = Router();

router.get("/", authMiddleware, getFacultes);
router.get("/:id", authMiddleware, validateParams(faculteIdParamSchema), getFaculteById);
router.post("/", authMiddleware, validateBody(createFaculteSchema), createFaculte);
router.put(
  "/:id",
  authMiddleware,
  validateParams(faculteIdParamSchema),
  validateBody(updateFaculteSchema),
  updateFaculte
);
router.delete(
  "/:id",
  authMiddleware,
  validateParams(faculteIdParamSchema),
  deleteFaculte
);

export default router;