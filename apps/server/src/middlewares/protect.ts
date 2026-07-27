import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies.accessToken;
  if (!token) return next(new AppError("Not authenticated", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as { id: string; name: string; email: string };
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Token expired, please login again", 401));
    }
    return next(new AppError("Invalid token", 401));
  }
};
