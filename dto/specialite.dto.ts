import { z } from "zod";

export const createSpecialiteSchema = z.object({
  filiere: z.string().min(1).max(150),
  nomSpecialite: z.string().min(1).max(150),
  nombrePlaces: z.number().int().min(1),
  idConcours: z.string().uuid(),
});

export const updateSpecialiteSchema = z.object({
  filiere: z.string().min(1).max(150).optional(),
  nomSpecialite: z.string().min(1).max(150).optional(),
  nombrePlaces: z.number().int().min(1).optional(),
  idConcours: z.string().uuid().optional(),
});
export const specialiteIdParamSchema = z.object({
    id: z.string().uuid(),
});

export type CreateSpecialiteInput = z.infer<typeof createSpecialiteSchema>;
export type UpdateSpecialiteInput = z.infer<typeof updateSpecialiteSchema>;