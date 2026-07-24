import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import AppError from "../utils/AppError.js";
import { registerUser } from "../services/auth.service.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";

export const signup = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const user = await registerUser({ name, email, password_hash: password });

    const payload = { id: user.id, name: user.name, email: user.email };
    const accesstoken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({ success: true, message: "User registered successfully...", user: payload, accesstoken, refreshToken });
}

export const refresh = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const { refreshToken } = req.body;

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
            id: string,
            name: string,
            email: string
        };
        const payload = { id: decoded.id, name: decoded.name, email: decoded.email };

        const newAccessToken = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    }
    catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            next(new AppError('Refresh token expired, please login again', 401));
        } else {
            next(new AppError('Invalid refresh token', 401));
        }
    }
}
