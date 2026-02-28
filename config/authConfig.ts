
import { CookieOptions } from "express";

const isProd = process.env.NODE_ENV === "production";

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const REFRESH_TOKEN_EXPIRES_IN = "1d";

export const accessCookieName = "access_token";
export const refreshCookieName = "refresh_token";

export const accessCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
    path: "/",
};

export const refreshCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 1 * 24 * 60 * 60 * 1000,
    path: "/auth",
};