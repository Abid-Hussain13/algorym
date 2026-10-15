import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";

interface RateBucket {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, RateBucket>();

const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}, 60_000);
sweep.unref?.();

/** Fixed-window in-memory rate limiter for the auth endpoints. . */
export const rateLimit = (bucketName: string, max: number, windowMs: number) =>
    (req: Request, _res: Response, next: NextFunction): void => {
        if (process.env.NODE_ENV === "test") return next();

        const key = `${bucketName}:${req.ip}`;
        const now = Date.now();
        const bucket = buckets.get(key);

        if (!bucket || bucket.resetAt <= now) {
            buckets.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        bucket.count += 1;
        if (bucket.count > max) {
            next(new AppError("Too many requests, please try again later", 429));
            return;
        }
        next();
    };
