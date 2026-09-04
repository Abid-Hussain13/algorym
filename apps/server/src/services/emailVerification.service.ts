import { nanoid } from 'nanoid';

import db from '../db/pool.js';
import AppError from '../utils/AppError.js';
import { sendVerificationEmail } from '../utils/email.js';

export const generateVerificationToken = async (userId: string, email: string): Promise<string> => {
    // Delete any existing verification tokens for this user
    await db.query("DELETE FROM tokens WHERE user_id = $1 AND type = 'email_verification'", [userId]);

    const token = nanoid(64);
    const expiryHours = Number(process.env.VERIFY_TOKEN_EXPIRY_HOURS) || 24;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    await db.query(
        'INSERT INTO tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)',
        [userId, token, 'email_verification', expiresAt]
    );

    // Log token for dev — email may fail on free Resend tier
    if (process.env.NODE_ENV !== 'production') {
        console.log(`\n📧 Verification link: ${process.env.CLIENT_URL}/verify-email?token=${token}\n`);
    }

    await sendVerificationEmail(email, token);

    return token;
};

export const verifyEmail = async (token: string): Promise<void> => {
    const tokenRow = await db.query(
        "SELECT user_id, expires_at FROM tokens WHERE token = $1 AND type = 'email_verification'",
        [token]
    );

    if (!tokenRow.rows.length) {
        throw new AppError('Invalid or expired verification token', 400);
    }

    if (new Date(tokenRow.rows[0].expires_at) < new Date()) {
        throw new AppError('Verification token has expired', 400);
    }

    await db.query('UPDATE users SET email_verified = true WHERE id = $1', [tokenRow.rows[0].user_id]);
    await db.query('DELETE FROM tokens WHERE token = $1', [token]);
};
