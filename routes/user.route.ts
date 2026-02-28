
import { Router } from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.conroller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../dto/user.dto";
import { validateBody, validateParams } from "../middleware/validate";
// éventuellement un middleware de RBAC
// import { requireRole } from "../middlewares/requireRole";

const router = Router();

router.get("/", authMiddleware, getUsers);
router.post("/", validateBody(createUserSchema), createUser);
router.put(
  "/:id",
  authMiddleware, validateBody(updateUserSchema),
  updateUser
);

router.delete("/:id", authMiddleware,
  validateParams(userIdParamSchema),
  deleteUser
);
export default router;

