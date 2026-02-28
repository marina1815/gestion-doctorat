
import { z } from "zod";

export const userRoleSchema = z.enum([
  "ADMIN",
  "CHEFDEPARTEMENT",
  "CFD",
  "CELLULE_ANONYMAT",
  "CORRECTEUR",
  "RESPONSABLE_SALLE",
  "DOYEN",
  "VICEDOYEN",
  "RECTEUR",
]);

export const createUserSchema = z
  .object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(4),
    role: userRoleSchema,
    // ✅ camelCase comme dans ton controller
    idMembre: z.string().uuid(),
  })
  .strict();

export const updateUserSchema = z
  .object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    password: z.string().min(4).optional(),
    role: userRoleSchema.optional(),
    idMembre: z.string().uuid().optional(),
  })
  .strict();

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const loginSchema = z
  .object({
    username: z.string().min(3).max(50),
    password: z.string().min(1),
  })
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;