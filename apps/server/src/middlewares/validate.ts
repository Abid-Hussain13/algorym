import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import AppError from "../utils/AppError.js";

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(new AppError("Validation failed", 400, errors));
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(new AppError("Validation failed", 400, errors));
    }
    (req as any).validatedQuery = result.data;
    next();
  };
};
