// src/routes/concours.routes.ts
import { Router } from "express";
import {
  createConcours,
  getConcours,
  getConcoursById,
  getConcoursByDepartement,
  updateConcours,
  deleteConcours,
  
} from "../controllers/concours.controller";

import {
  createConcoursSchema,
  updateConcoursSchema,
  concoursIdParamSchema,
} from "../dto/concours.dto";

import { validateBody, validateParams } from "../middleware/validate";
 import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
 authMiddleware,
  getConcours
);



router.get(
  "/:id",
  validateParams(concoursIdParamSchema),
   authMiddleware,
  getConcoursById
);


router.get(
  "/departement/:idDepartement",
  authMiddleware,
  getConcoursByDepartement
);


router.post(
  "/",
   authMiddleware,
  validateBody(createConcoursSchema),
  createConcours
);


router.put(
  "/:id",
  validateParams(concoursIdParamSchema),
  validateBody(updateConcoursSchema),
 authMiddleware,
  updateConcours
);


router.delete(
  "/:id",
  validateParams(concoursIdParamSchema),
  authMiddleware,
  deleteConcours
);

export default router;