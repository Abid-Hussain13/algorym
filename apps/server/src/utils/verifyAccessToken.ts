import jwt from "jsonwebtoken";
import db from "../db/pool.js";
import AppError from "./AppError.js";
import type { AuthPayload } from "../types/index.js";

/** Verifies an access token and rejects it if the account's token_version has . */
export const verifyAccessToken = async (token: string): Promise<AuthPayload> => {
    let decoded: AuthPayload;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AppError("Token expired, please login again", 401);
        }
        throw new AppError("Invalid token", 401);
    }

    const { rows } = await db.query<{ token_version: number }>(
        "SELECT token_version FROM users WHERE id = $1",
        [decoded.id]
    );

    if (!rows[0] || rows[0].token_version !== decoded.token_version) {
        throw new AppError("Session expired, please login again", 401);
    }

    return decoded;
};

/** Verifies signature + expiry of a refresh token without the DB round trip. . */
export const verifyRefreshToken = (token: string): Promise<AuthPayload> => {
    try {
        return Promise.resolve(jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as AuthPayload);
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return Promise.reject(new AppError("Refresh token expired, please login again", 401));
        }
        return Promise.reject(new AppError("Invalid refresh token", 401));
    }
};

export const resolveAccessTokenUserId = async (token: string | undefined): Promise<string | undefined> => {
    if (!token) return undefined;
    try {
        const decoded = await verifyAccessToken(token);
        return decoded.id;
    } catch {
        return undefined;
    }
};
