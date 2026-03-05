import { z } from "zod";

export const createCorrecteurSchema = z.object({
  idConcours: z.string().uuid("idConcours doit être un UUID valide"),
  idUser: z.string().uuid("idUser doit être un UUID valide"),
  idSpecialite: z.string().uuid("idSpecialite doit être un UUID valide"),
});

export const updateCorrecteurSchema = z.object({
  idConcours: z.string().uuid("idConcours doit être un UUID valide").optional(),
  idUser: z.string().uuid("idUser doit être un UUID valide").optional(),
  idSpecialite: z
    .string()
    .uuid("idSpecialite doit être un UUID valide")
    .optional(),
});

export const correcteurIdParamSchema = z.object({
  idCorrecteur: z
    .string("idCorrecteur est obligatoire")
    .uuid("idCorrecteur doit être un UUID valide"),
});

export type CreateCorrecteurDto = z.infer<typeof createCorrecteurSchema>;
export type UpdateCorrecteurDto = z.infer<typeof updateCorrecteurSchema>;