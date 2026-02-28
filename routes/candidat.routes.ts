import { Router } from "express";
import {
  createCandidat,
  getCandidats,
  getCandidatById,
  getCandidatsBySpecialite,
  updateCandidat,
  deleteCandidat,
} from "../controllers/candidat.controller";

import {
  createCandidatSchema,
  updateCandidatSchema,
  candidatIdParamSchema,
  candidatSpecialiteParamSchema,
} from "../dto/candidat.dto";

import { validateBody, validateParams } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();


router.get("/",  authMiddleware,  getCandidats);

// GET by ID
router.get(
  "/:id",
  validateParams(candidatIdParamSchema),
   authMiddleware, 
  getCandidatById
);


router.get(
  "/specialite/:idSpecialite",
  validateParams(candidatSpecialiteParamSchema),
  authMiddleware, 
  getCandidatsBySpecialite
);

// CREATE
router.post(
  "/",
   authMiddleware,
  validateBody(createCandidatSchema),
  createCandidat
);


router.put(
  "/:id",
  validateParams(candidatIdParamSchema),
  authMiddleware,
  validateBody(updateCandidatSchema),
  updateCandidat
);

// DELETE
router.delete(
  "/:id",
  validateParams(candidatIdParamSchema),
  deleteCandidat
);

export default router;