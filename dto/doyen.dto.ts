
import { z } from "zod";


export const createDoyenSchema = z.object({
  idMembre: z
    .string()
    .uuid("idMembre doit être un UUID valide"),

  idFaculte: z
    .string()
    .uuid("idFaculte doit être un UUID valide"),
});

export type CreateDoyenInput = z.infer<typeof createDoyenSchema>;

/**
 * DTO pour la mise à jour
 */
export const updateDoyenSchema = z.object({
  idMembre: z.string().uuid("idMembre doit être un UUID valide").optional(),
  idFaculte: z.string().uuid("idFaculte doit être un UUID valide").optional(),
});

export type UpdateDoyenInput = z.infer<typeof updateDoyenSchema>;

/**
 * DTO des paramètres d'URL (idDoyen)
 */
export const doyenIdParamSchema = z.object({
  idDoyen: z
    .string()
    .uuid("idDoyen doit être un UUID valide"),
});