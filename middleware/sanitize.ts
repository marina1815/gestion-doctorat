import { Request, Response, NextFunction } from "express";
import validator from "validator";

/**
 * Nettoie une valeur string :
 * - supprime caractères invisibles
 * - trim
 * - réduit espaces multiples
 * - échappe HTML (anti-XSS basique)
 */
function cleanString(value: string): string {
    let v = value;

    v = v.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

    v = v.trim();

    v = v.replace(/\s+/g, " ");

    v = validator.escape(v);

    return v;
}

function sanitizeInPlace(input: any): void {
    if (Array.isArray(input)) {
        for (let i = 0; i < input.length; i++) {
            const val = input[i];
            if (typeof val === "string") {
                input[i] = cleanString(val);
            } else if (val && typeof val === "object") {
                sanitizeInPlace(val);
            }
        }
        return;
    }

    if (input && typeof input === "object") {
        for (const key of Object.keys(input)) {
            const val = (input as any)[key];

            if (typeof val === "string") {
                (input as any)[key] = cleanString(val);
            } else if (Array.isArray(val)) {
                sanitizeInPlace(val);
            } else if (val && typeof val === "object") {
                sanitizeInPlace(val);
            }
        }
    }
}

export function sanitize(req: Request, res: Response, next: NextFunction) {
    if (req.body) {
        sanitizeInPlace(req.body);
    }

    if (req.query) {
        sanitizeInPlace(req.query);
    }

    if (req.params) {
        sanitizeInPlace(req.params);
    }

    next();
}
