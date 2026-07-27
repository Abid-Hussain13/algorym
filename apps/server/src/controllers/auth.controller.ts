import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import AppError from "../utils/AppError.js";
import { loginUser, registerUser } from "../services/auth.service.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ACCESS_TOKEN_MAX_AGE,
        path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: "/api/auth/refresh",
    });
};

export const signup = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const user = await registerUser({ name, email, password_hash: password });

    const payload = { id: user.id, name: user.name, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setAuthCookies(res, accessToken, refreshToken);

    res.json({ success: true, message: "User registered successfully", user: payload });
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await loginUser({ email, password_hash: password });

    const payload = { id: user.id, name: user.name, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setAuthCookies(res, accessToken, refreshToken);

    res.json({ success: true, message: "User logged in successfully", user: payload });
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
    res.json({ success: true, user: req.user });
};
