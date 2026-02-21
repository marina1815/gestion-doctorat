import { z } from "zod";

export const userRoleSchema = z.enum([
  "ADMIN",
  "CHEFDEPARTEMENT",
  "CFD",
  "CELLULE_ANONYMAT",
  "CORRECTEUR",
  "RESPONSABLE_SALLE",
]);

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(4),
  role: userRoleSchema,
}).strict(); 

export const updateUserSchema = createUserSchema
  .partial()
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
