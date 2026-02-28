// dto/membre.dto.ts
import { z } from "zod";

export const sexeEnum = z.enum(["HOMME", "FEMME"]);

export const createMembreSchema = z.object({
  nomMembre: z.string().min(1, "Le nom est obligatoire."),
  prenomMembre: z.string().min(1, "Le prénom est obligatoire."),
  nomAr: z.string().max(100).optional().nullable(),
  prenomAr: z.string().max(100).optional().nullable(),
  grade: z.string().max(100).optional().nullable(),
  sexe: sexeEnum,
});

export const updateMembreSchema = createMembreSchema.partial();

/**
 * Pour valider /:id dans l’URL
 */
export const membreIdParamSchema = z.object({
  id: z.string().uuid("Identifiant de membre invalide."),
});

// Types TS dérivés des schémas
export type CreateMembreDto = z.infer<typeof createMembreSchema>;
export type UpdateMembreDto = z.infer<typeof updateMembreSchema>;
export type MembreIdParamDto = z.infer<typeof membreIdParamSchema>;