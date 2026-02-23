
import jwt, { JwtPayload } from "jsonwebtoken";
import {
    ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN,
} from "../config/authConfig";
import crypto from "crypto";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET ou REFRESH_TOKEN_SECRET non définis dans .env");
}

export interface TokenPayload {
    sub: string;          
    role?: string;
    username?: string;
    tokenVersion?: number;
    jti?: string;
}

export interface DecodedToken extends Omit<JwtPayload, "sub">, TokenPayload { }

export function generateJti(): string {
    return crypto.randomUUID();
}

export function signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
}

export function signRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
}

export function verifyAccessToken(token: string): DecodedToken {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as DecodedToken;
}

export function verifyRefreshToken(token: string): DecodedToken {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as DecodedToken;
}

export function createTokenPair(user: {
    id: string;
    role?: string;
    username?: string;
    tokenVersion?: number;
}) {
    const jti = generateJti();

    const payload: TokenPayload = {
        sub: user.id,
        role: user.role,
        username: user.username,
        tokenVersion: user.tokenVersion ?? 0,
        jti,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return { accessToken, refreshToken, jti };
}