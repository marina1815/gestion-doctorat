import { z } from "zod";

export const createConcoursSchema = z.object({
    nomConcours: z.string().min(1).max(150),
    annee: z.number().int().min(2000).max(2100),
    dateConcours: z.coerce.date().optional(),
    idDepartement: z.string().uuid(),
});

export const updateConcoursSchema = z.object({
    nomConcours: z.string().min(1).max(150).optional(),
    annee: z.number().int().min(2000).max(2100).optional(),
    dateConcours: z.coerce.date().optional(),
    idDepartement: z.string().uuid().optional(),
});
export const concoursIdParamSchema = z.object({
    id: z.string().uuid(),
});

export type CreateConcoursInput = z.infer<typeof createConcoursSchema>;
export type UpdateConcoursInput = z.infer<typeof updateConcoursSchema>;