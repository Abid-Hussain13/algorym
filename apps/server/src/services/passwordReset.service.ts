import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

import db from '../db/pool.js';
import AppError from '../utils/AppError.js';
import { sendPasswordResetEmail } from '../utils/email.js';

export const generateResetToken = async (email: string): Promise<void> => {
    const user = await db.query('SELECT id FROM users WHERE email = $1', [email]);

    // Always return success to prevent email enumeration
    if (!user.rows.length) return;

    // Delete any existing reset tokens for this user
    await db.query("DELETE FROM tokens WHERE user_id = $1 AND type = 'password_reset'", [user.rows[0].id]);

    const token = nanoid(64);
    const expiryMinutes = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES) || 15;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await db.query(
        'INSERT INTO tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)',
        [user.rows[0].id, token, 'password_reset', expiresAt]
    );

    if (process.env.NODE_ENV !== 'production') {
        console.log(`\n🔑 Password reset link: ${process.env.CLIENT_URL}/reset-password?token=${token}\n`);
    }

    await sendPasswordResetEmail(email, token);
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    const tokenRow = await db.query(
        "SELECT user_id, expires_at FROM tokens WHERE token = $1 AND type = 'password_reset'",
        [token]
    );

    if (!tokenRow.rows.length) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    if (new Date(tokenRow.rows[0].expires_at) < new Date()) {
        throw new AppError('Reset token has expired', 400);
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, tokenRow.rows[0].user_id]);
    await db.query('DELETE FROM tokens WHERE token = $1', [token]);
};
