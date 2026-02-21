import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

type Source = "body" | "query" | "params";


function validate(source: Source) {
    return (schema: ZodSchema) =>
        (req: Request, res: Response, next: NextFunction) => {
            const data = (req as any)[source];

            try {
                const parsed = schema.parse(data);

                (req as any)[source] = parsed;

                return next();
            } catch (err) {
                if (err instanceof ZodError) {
                    const errors = err.issues.map((issue) => ({
                        champ: issue.path.join("."),
                        message: issue.message,
                    }));

                    return res.status(400).json({
                        error: "Erreur de validation",
                        details: errors,
                    });
                }

                return next(err);
            }
        };
}

export const validateBody = validate("body");
export const validateQuery = validate("query");
export const validateParams = validate("params");
