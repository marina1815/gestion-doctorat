import { z } from "zod";

export const createDepartementSchema = z.object({
  nomDepartement: z.string().min(1).max(150),
  idFaculte: z.string().uuid(),
});

export const updateDepartementSchema = z.object({
  nomDepartement: z.string().min(1).max(150).optional(),
  idFaculte: z.string().uuid().optional(),
});
export const departementIdParamSchema = z.object({
  id: z.string().uuid(),
});




export type DepartementIdParamDto = z.infer<typeof departementIdParamSchema>;
export type CreateDepartementInput = z.infer<typeof createDepartementSchema>;
export type UpdateDepartementInput = z.infer<typeof updateDepartementSchema>;