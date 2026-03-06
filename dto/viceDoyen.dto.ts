// dto/viceDoyen.dto.ts
import { z } from "zod";

/**
 * Création d'un vice-doyen
 * On envoie idFaculte + idUser
 */
export const createViceDoyenSchema = z.object({
  idFaculte: z.string().uuid("idFaculte doit être un UUID valide"),
  idMembre: z.string().uuid("idMembre doit être un UUID valide"),
});

export type CreateViceDoyenInput = z.infer<typeof createViceDoyenSchema>;

/**
 * Mise à jour (facultatif, si tu veux pouvoir changer le user ou faculte)
 */
export const updateViceDoyenSchema = z.object({
  idFaculte: z.string().uuid().optional(),
  idMembre: z.string().uuid().optional(),
});

export type UpdateViceDoyenInput = z.infer<typeof updateViceDoyenSchema>;

/**
 * Paramètre : id de la ligne vice_doyen
 */
export const viceDoyenIdParamSchema = z.object({
  id: z.string().uuid("id doit être un UUID valide"),
});

export type ViceDoyenIdParam = z.infer<typeof viceDoyenIdParamSchema>;