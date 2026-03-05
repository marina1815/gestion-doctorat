

import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate";
import {
  createDoyenSchema,
  updateDoyenSchema,
  doyenIdParamSchema,
} from "../dto/doyen.dto";
import {
  getDoyens,
  getDoyenById,
  createDoyen,
  updateDoyen,
  deleteDoyen,
} from "../controllers/doyen.controller";

const router = Router();


router.get("/", authMiddleware, getDoyens);


router.get(
  "/:id",
  authMiddleware,
  validateParams(doyenIdParamSchema),
  getDoyenById
);


router.post(
  "/",
  authMiddleware,
  validateBody(createDoyenSchema),
  createDoyen
);


router.put(
  "/:id",
  authMiddleware,
  validateParams(doyenIdParamSchema),
  validateBody(updateDoyenSchema),
  updateDoyen
);


router.delete(
  "/:id",
  authMiddleware,
  validateParams(doyenIdParamSchema),
  deleteDoyen
);

export default router;