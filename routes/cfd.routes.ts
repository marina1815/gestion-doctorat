// src/routes/cfd.routes.ts
import { Router } from "express";
import {
  createCfd,
  getCfds,
  getCfdById,
  getCfdsByConcours,
  updateCfd,
  deleteCfd,
} from "../controllers/cfd.controller";

import {
  createCfdSchema,
  updateCfdSchema,
  cfdIdParamSchema,
} from "../dto/cfd.dto";

import { validateBody, validateParams } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// GET /api/cfds
router.get(
  "/",
  authMiddleware,
  getCfds
);

// GET /api/cfds/concours/:idConcours
router.get(
  "/concours/:idConcours",
  authMiddleware,
  getCfdsByConcours
);

// GET /api/cfds/:idCfd
router.get(
  "/:idCfd",
  validateParams(cfdIdParamSchema),
  authMiddleware,
  getCfdById
);

// POST /api/cfds
router.post(
  "/",
  authMiddleware,
  validateBody(createCfdSchema),
  createCfd
);

// PUT /api/cfds/:idCfd
router.put(
  "/:idCfd",
  validateParams(cfdIdParamSchema),
  validateBody(updateCfdSchema),
  authMiddleware,
  updateCfd
);

// DELETE /api/cfds/:idCfd
router.delete(
  "/:idCfd",
  validateParams(cfdIdParamSchema),
  authMiddleware,
  deleteCfd
);

export default router;