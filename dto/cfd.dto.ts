
import { z } from "zod";

export const createCfdSchema = z.object({
    idConcours: z
        .string()
        .uuid("idConcours doit être un UUID valide"),

    idUser: z
        .string(
    )
        .uuid("idUser doit être un UUID valide"),
});

export const updateCfdSchema = z.object({
    idConcours: z
        .string()
        .uuid("idConcours doit être un UUID valide")
        .optional(),
    idUser: z
        .string()
        .uuid("idUser doit être un UUID valide")
        .optional(),
});

export const cfdIdParamSchema = z.object({
    idCfd: z
        .string("idCfd est obligatoire")
        .uuid("idCfd doit être un UUID valide"),
});

export type CreateCfdDto = z.infer<typeof createCfdSchema>;
export type UpdateCfdDto = z.infer<typeof updateCfdSchema>;