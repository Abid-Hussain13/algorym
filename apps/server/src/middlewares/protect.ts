import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/verifyAccessToken.js";

export const protect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = req.cookies.accessToken;
    if (!token) return next(new AppError("Not authenticated", 401));

    try {
        req.user = await verifyAccessToken(token);
        next();
    } catch (error) {
        next(error);
    }
};
