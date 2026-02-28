import { z } from "zod";

export const createFaculteSchema = z.object({
  nomFaculte: z.string().min(1).max(150),
});

export const updateFaculteSchema = z.object({
  nomFaculte: z.string().min(1).max(150).optional(),
});


export const faculteIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateFaculteDto = z.infer<typeof createFaculteSchema>;
export type UpdateFaculteDto = z.infer<typeof updateFaculteSchema>;
export type FaculteIdParamDto = z.infer<typeof faculteIdParamSchema>;