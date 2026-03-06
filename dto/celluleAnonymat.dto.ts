import { z } from "zod";

export const createCelluleAnonymatSchema = z.object({
  idConcours: z.string().uuid("idConcours doit être un UUID valide"),
  idMembre: z.string().uuid("idMembre doit être un UUID valide"),
});

export const updateCelluleAnonymatSchema = z.object({
  idConcours: z.string().uuid("idConcours doit être un UUID valide").optional(),
  idMembre: z.string().uuid("idMembre doit être un UUID valide").optional(),
});

export const celluleAnonymatIdParamSchema = z.object({
  idCelluleAnonymat: z
    .string("idCelluleAnonymat est obligatoire")
    .uuid("idCelluleAnonymat doit être un UUID valide"),
});

export type CreateCelluleAnonymatDto = z.infer<typeof createCelluleAnonymatSchema>;
export type UpdateCelluleAnonymatDto = z.infer<typeof updateCelluleAnonymatSchema>;