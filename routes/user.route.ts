
import { Router } from "express";
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
} from "../controllers/user.conroller";

import {
    createUserSchema,
    updateUserSchema,
    deleteUserParamSchema,
} from "../dto/user.dto";
import { validateBody, validateParams } from "../middleware/validate";
// éventuellement un middleware de RBAC
// import { requireRole } from "../middlewares/requireRole";

const router = Router();

router.get("/", getUsers);
router.post("/", validateBody(createUserSchema), createUser);
router.put(
  "/:id",
  validateBody(updateUserSchema), 
  updateUser
);

router.delete("/:id",
  validateParams(deleteUserParamSchema),
  deleteUser
);
export default router;

