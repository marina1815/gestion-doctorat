import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(`[${new Date().toISOString()}]  Erreur:`, err);

  // Zod error
  if (err instanceof ZodError) {
    const erreurs = err.issues.map((issue) => ({
      champ: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      erreur: "Erreur de validation",
      details: erreurs,
    });
  }

  // JSON invalide
  if (typeof err === "object" && err !== null && "type" in err) {
    const e = err as any;
    if (e.type === "entity.parse.failed") {
      return res.status(400).json({
        erreur: "JSON invalide",
        message: "Le corps de la requête contient un JSON non valide.",
      });
    }
  }

  // unique_violation PostgreSQL
  if (err.code === "23505") {
    let detail = "Cette valeur est déjà utilisée.";

    if (err.detail?.includes("username"))
      detail = "Ce nom d'utilisateur est déjà utilisé.";

    if (err.detail?.includes("email"))
      detail = "Cet email est déjà utilisé.";

    return res.status(409).json({
      erreur: "Conflit",
      message: detail,
    });
  }

  // erreur serveur
  return res.status(500).json({
    erreur: "Erreur interne",
    message: "Une erreur inattendue est survenue. Veuillez réessayer plus tard.",
  });
}

export function notFoundHandler(req: Request, res: Response) {
    return res.status(404).json({
        error: "Route non trouvée",
        message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
    });
}
