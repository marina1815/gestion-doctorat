
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
} from "../dto/user.dto";
import { validateBody, validateParams } from "../middleware/validate";
// éventuellement un middleware de RBAC
// import { requireRole } from "../middlewares/requireRole";

const router = Router();

// Exemple : seulement ADMIN peut créer un user
// router.post("/", requireRole("ADMIN"), validateBody(createUserSchema), createUser);

router.post("/", validateBody(createUserSchema), createUser);
router.get("/", getUsers);

export default router;

