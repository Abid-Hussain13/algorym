import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import AppError from "../utils/AppError.js";
import { loginUser, registerUser } from "../services/auth.service.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import { generateVerificationToken } from "../services/emailVerification.service.js";
import type { User } from "@algorym/shared-types";

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 1000;

/**
 * `SameSite` has to match how the app is actually deployed.
 *
 * In production the frontend and the API are on **different domains** —
 * `*.netlify.app` and `*.onrender.com` are separate registrable domains, so from
 * the browser's point of view every API call is *cross-site*.
 *
 * `SameSite=Strict` (or even `Lax`) means "only ever send this cookie for requests
 * made by a page on this same site". On a cross-site deployment that is never
 * true, so the browser silently **refused to send the refresh token at all**. The
 * refresh endpoint then saw no cookie, answered 401, and the client logged the
 * user out with "Session expired" — even though they had just signed up.
 *
 * `SameSite=None` is the only value that permits a cross-site cookie, and the
 * spec requires it to be paired with `Secure`. Both are gated on production
 * because local development is genuinely same-site (same host, only the port
 * differs), where `Secure` cookies would be rejected over plain http anyway.
 *
 * Caveat worth knowing: `SameSite=None` depends on the browser not blocking
 * third-party cookies outright. Chrome and Firefox allow it; Safari does not by
 * default. See the note in decision.md for the options.
 */
const isProduction = process.env.NODE_ENV === "production";

const cookieSiteSettings = {
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    secure: isProduction,
};

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        ...cookieSiteSettings,
        maxAge: ACCESS_TOKEN_MAX_AGE,
        path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        ...cookieSiteSettings,
        maxAge: REFRESH_TOKEN_MAX_AGE,
        // Scoped to the one endpoint that needs it, so the long-lived refresh
        // token is not attached to every ordinary API call.
        path: "/api/auth/refresh",
    });
};

export const signup = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const user = await registerUser({ name, email, password_hash: password });

    const payload: Omit<User, 'password_hash'> = { id: user.id, name: user.name, email: user.email, email_verified: user.email_verified, created_at: user.created_at };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setAuthCookies(res, accessToken, refreshToken);

    // Send verification email (non-blocking)
    generateVerificationToken(user.id, email).catch((err) => {
        console.error('Failed to send verification email:', err.message || err);
    });

    res.json({ success: true, data: payload, message: "User registered successfully", statusCode: 201 });
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await loginUser({ email, password_hash: password });

    const payload: Omit<User, 'password_hash'> = { id: user.id, name: user.name, email: user.email, email_verified: user.email_verified, created_at: user.created_at };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setAuthCookies(res, accessToken, refreshToken);
    console.log("i am in login controller. with success")
    res.json({ success: true, data: payload, message: "User logged in successfully" });
};

export const refresh = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return next(new AppError("No refresh token", 401));

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
            id: string;
            name: string;
            email: string;
        };

        const payload = { id: decoded.id, name: decoded.name, email: decoded.email };
        const newAccessToken = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);

        setAuthCookies(res, newAccessToken, newRefreshToken);

        res.json({ success: true, message: "Tokens refreshed" });
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return next(new AppError("Refresh token expired, please login again", 401));
        }
        return next(new AppError("Invalid refresh token", 401));
    }
};


export const getMe = (req: Request, res: Response) => {
    res.json({ success: true, data: req.user });
};


export const logout = (_req: Request, res: Response): void => {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

    res.json({ success: true })
}
