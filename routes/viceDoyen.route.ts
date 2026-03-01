

import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate";
import {
  createViceDoyenSchema,
  updateViceDoyenSchema,
  viceDoyenIdParamSchema,
} from "../dto/viceDoyen.dto";
import {
  getViceDoyens,
  getViceDoyenById,
  createViceDoyen,
  updateViceDoyen,
  deleteViceDoyen,
} from "../controllers/viceDoyen.controller";

const router = Router();


router.get("/", authMiddleware, getViceDoyens);


router.get(
  "/:id",
  authMiddleware,
  validateParams(viceDoyenIdParamSchema),
  getViceDoyenById
);


router.post(
  "/",
  authMiddleware,
  validateBody(createViceDoyenSchema),
  createViceDoyen
);


router.put(
  "/:id",
  authMiddleware,
  validateParams(viceDoyenIdParamSchema),
  validateBody(updateViceDoyenSchema),
  updateViceDoyen
);


router.delete(
  "/:id",
  authMiddleware,
  validateParams(viceDoyenIdParamSchema),
  deleteViceDoyen
);

export default router;