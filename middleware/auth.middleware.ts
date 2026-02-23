
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../service/tokenService";
import { accessCookieName } from "../config/authConfig";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
    username?: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  if (req.cookies?.[accessCookieName]) {
    token = req.cookies[accessCookieName];
  }

  const authHeader = req.headers.authorization;
  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      error: "Accès refusé",
      message: "Token d'authentification manquant",
      code: "NO_ACCESS_TOKEN",
    });
  }

  try {
    const decoded = verifyAccessToken(token);

    req.user = {
      id: String(decoded.sub),
      role: decoded.role,
      username: decoded.username,
    };

    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: "Token expiré",
        message: "Access token expiré",
        code: "ACCESS_TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      error: "Token invalide",
      message: "Le token est invalide",
      code: "ACCESS_TOKEN_INVALID",
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Non authentifié",
        message: "Vous devez être authentifié",
      });
    }

    if (!roles.includes(req.user.role || "")) {
      return res.status(403).json({
        error: "Accès interdit",
        message: `Rôle requis : ${roles.join(" ou ")}. Votre rôle : ${req.user.role}`,
      });
    }

    return next();
  };
};