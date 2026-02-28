import { z } from "zod";

export const createCandidatSchema = z.object({
  nomCandidat: z.string().min(1).max(100),
  prenomCandidat: z.string().min(1).max(100),
  matricule: z.string().min(1).max(50),
  dateNaissance: z.coerce.date().optional(),
  statutCommun: z.enum(["PRESENT", "ABSENT"]),
  statutSpecialite: z.enum(["PRESENT", "ABSENT"]),
  idSpecialite: z.string().uuid(),
});

export const updateCandidatSchema = createCandidatSchema.partial();


export const candidatIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const candidatSpecialiteParamSchema = z.object({
  idSpecialite: z.string().uuid(),
});

export type CreateCandidatInput = z.infer<typeof createCandidatSchema>;
export type UpdateCandidatInput = z.infer<typeof updateCandidatSchema>;
export type CandidatIdParam = z.infer<typeof candidatIdParamSchema>;
export type CandidatSpecialiteParam = z.infer<typeof candidatSpecialiteParamSchema>;