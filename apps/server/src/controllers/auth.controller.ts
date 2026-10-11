import { NextFunction, Request, Response } from "express";

import AppError from "../utils/AppError.js";
import { loginUser, registerUser } from "../services/auth.service.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import { generateVerificationToken } from "../services/emailVerification.service.js";
import { verifyAccessToken, verifyRefreshToken } from "../utils/verifyAccessToken.js";
import db from "../db/pool.js";

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";

const cookieSiteSettings = {
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    secure: isProduction,
};

/**
 * Clearing needs the same attributes the cookies were set with (path,
 * sameSite, secure) or strict browsers keep them — silently making logout
 * a no-op in production.
 */
export const clearAuthCookies = (res: Response): void => {
    res.clearCookie("accessToken", { path: "/", ...cookieSiteSettings, httpOnly: true });
    res.clearCookie("refreshToken", { path: "/api/auth/refresh", ...cookieSiteSettings, httpOnly: true });
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
        path: "/api/auth/refresh",
    });
};

type SafeUser = { id: string; name: string; email: string; email_verified: boolean; token_version: number };

const issueTokens = (res: Response, user: SafeUser) => {
    const jwtPayload = { id: user.id, name: user.name, email: user.email, token_version: user.token_version };
    setAuthCookies(res, generateAccessToken(jwtPayload), generateRefreshToken(jwtPayload));
    return { id: user.id, name: user.name, email: user.email, email_verified: user.email_verified };
};

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, email, password } = req.body;
        const user = await registerUser({ name, email, password_hash: password });

        const data = issueTokens(res, user);

        generateVerificationToken(user.id, email, user.name).catch((err) => {
            console.error('Failed to send verification email:', err.message || err);
        });

        res.status(201).json({ success: true, data, message: "User registered successfully" });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;
        const user = await loginUser({ email, password_hash: password });

        const data = issueTokens(res, user);

        res.json({ success: true, data, message: "User logged in successfully" });
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) throw new AppError("No refresh token", 401);

        const decoded = await verifyRefreshToken(refreshToken);

        const { rows } = await db.query<SafeUser>(
            "SELECT id, name, email, email_verified, token_version FROM users WHERE id = $1",
            [decoded.id]
        );
        if (!rows[0] || rows[0].token_version !== decoded.token_version) {
            throw new AppError("Session expired, please login again", 401);
        }

        issueTokens(res, rows[0]);
        res.json({ success: true, message: "Tokens refreshed" });
    } catch (error) {
        next(error);
    }
};

export const getMe = (req: Request, res: Response) => {
    const user = req.user!;
    res.json({ success: true, data: { id: user.id, name: user.name, email: user.email } });
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;
        let userId: string | undefined;
        try {
            if (accessToken) userId = (await verifyAccessToken(accessToken)).id;
        } catch {
            // access token invalid/expired — fall back to the refresh token
        }
        if (!userId && refreshToken) {
            try {
                userId = (await verifyRefreshToken(refreshToken)).id;
            } catch {
                // both tokens invalid — nothing to revoke
            }
        }
        if (userId) {
            await db.query("UPDATE users SET token_version = token_version + 1 WHERE id = $1", [userId]);
        }

        clearAuthCookies(res);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};
