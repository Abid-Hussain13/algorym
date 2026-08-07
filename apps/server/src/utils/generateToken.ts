import jwt, { SignOptions } from "jsonwebtoken";

export const generateAccessToken = (payload: object): string => {
    const secret = process.env.JWT_SECRET as string;
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRY || '15m';

    return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] });
}

export const generateRefreshToken = (payload: object): string => {
    const secret = process.env.JWT_REFRESH_SECRET as string;
    const expiresIn = process.env.REFRESH_TOKEN_EXPIRY || '7d';

    return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] });
}
