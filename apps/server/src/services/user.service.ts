import bcrypt from "bcrypt";
import db from "../db/pool.js";
import AppError from "../utils/AppError.js";
import type { UserPreferences } from "@algorym/shared-types";

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    const { rows } = await db.query("SELECT password_hash FROM users WHERE id = $1", [userId]);
    if (!rows.length) {
        throw new AppError("User not found", 404);
    }

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) {
        throw new AppError("Current password is incorrect", 401, [
            { field: "current_password", message: "Current password is incorrect" }
        ]);
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);
};

export const getPreferences = async (userId: string): Promise<UserPreferences> => {
    const { rows } = await db.query(
        `SELECT theme, default_language, default_duration_minutes
         FROM user_preferences WHERE user_id = $1`,
        [userId]
    );

    if (!rows.length) {
        return { theme: "system", default_language: null, default_duration_minutes: null };
    }

    return rows[0];
};

export const upsertPreferences = async (
    userId: string,
    prefs: { theme?: string; default_language?: string | null; default_duration_minutes?: number | null }
): Promise<UserPreferences> => {
    const existing = await getPreferences(userId);

    const theme = prefs.theme ?? existing.theme;
    const defaultLanguage = prefs.default_language !== undefined ? prefs.default_language : existing.default_language;
    const defaultDuration = prefs.default_duration_minutes !== undefined ? prefs.default_duration_minutes : existing.default_duration_minutes;

    const { rows } = await db.query(
        `INSERT INTO user_preferences (user_id, theme, default_language, default_duration_minutes, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id) DO UPDATE
         SET theme = $2, default_language = $3, default_duration_minutes = $4, updated_at = NOW()
         RETURNING theme, default_language, default_duration_minutes`,
        [userId, theme, defaultLanguage, defaultDuration]
    );

    return rows[0];
};

export const deleteAccount = async (userId: string): Promise<void> => {
    await db.query("DELETE FROM users WHERE id = $1", [userId]);
};
