// src/routes/specialite.routes.ts
import { Router } from "express";
import {
    createSpecialite,
    getSpecialites,
    getSpecialiteById,
    getSpecialitesByConcours,
    updateSpecialite,
    deleteSpecialite,
    getNombrePlacesSpecialitesByConcours,
    getFiliereByConcour
} from "../controllers/specialite.controller";

import {
    createSpecialiteSchema,
    updateSpecialiteSchema,
    specialiteIdParamSchema,
} from "../dto/specialite.dto";

import { validateBody, validateParams } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// GET /api/specialites
router.get(
    "/",
    authMiddleware,
    getSpecialites
);

// GET /api/specialites/:id

router.get(
    "/concours/nombrePlaces/:idConcours",
    getNombrePlacesSpecialitesByConcours
);

router.get(
  "/filiere/:idConcours",
  getFiliereByConcour
);

router.get(
    "/concours/:idConcours",
    authMiddleware,
    getSpecialitesByConcours
);
router.get(
    "/:id",
    validateParams(specialiteIdParamSchema),
    authMiddleware,
    getSpecialiteById
);

// POST /api/specialites
router.post(
    "/",
    authMiddleware,
    validateBody(createSpecialiteSchema),
    createSpecialite
);

// PUT /api/specialites/:id
router.put(
    "/:id",
    validateParams(specialiteIdParamSchema),
    validateBody(updateSpecialiteSchema),
    authMiddleware,
    updateSpecialite
);



router.delete(
    "/:id",
    validateParams(specialiteIdParamSchema),
    authMiddleware,
    deleteSpecialite
);

export default router;