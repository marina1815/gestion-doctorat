// src/routes/departement.routes.ts
import { Router } from "express";
import {
  createDepartement,
  getDepartements,
  getDepartementById,
  getDepartementsByFaculte,
  updateDepartement,
  deleteDepartement,
  getDepartementsByConcours
} from "../controllers/departement.controller";

import {
  createDepartementSchema,
  updateDepartementSchema,
  departementIdParamSchema,
 
} from "../dto/departement.dto";

import { validateBody, validateParams } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// GET /api/departements
router.get(
  "/",
 authMiddleware,
  getDepartements
);

// GET /api/departements/:id
router.get(
  "/:id",
  validateParams(departementIdParamSchema),
 authMiddleware,
  getDepartementById
);

// GET /api/departements/faculte/:idFaculte
router.get(
  "/faculte/:idFaculte",
    authMiddleware,
  getDepartementsByFaculte
);
router.get(
  "/concours/:idConcours",
  getDepartementsByConcours
);

// POST /api/departements
router.post(
  "/",
 authMiddleware,
  validateBody(createDepartementSchema),
  createDepartement
);

// PUT /api/departements/:id
router.put(
  "/:id",
  validateParams(departementIdParamSchema),
  validateBody(updateDepartementSchema),
  authMiddleware,
  updateDepartement
);


// DELETE /api/departements/:id
router.delete(
  "/:id",
  validateParams(departementIdParamSchema),
 authMiddleware,
  deleteDepartement
);

export default router;