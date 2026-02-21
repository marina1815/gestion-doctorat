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
// éventuellement un middleware de RBAC
// import { requireRole } from "../middlewares/requireRole";

const router = Router();

// Exemple : seulement ADMIN peut créer un user
// router.post("/", requireRole("ADMIN"), validateBody(createUserSchema), createUser);

router.post("/", createUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
