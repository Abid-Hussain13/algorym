import { randomBytes } from "crypto";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseEnvFile(p: string): Record<string, string> {
    const out: Record<string, string> = {};
    if (!existsSync(p)) return out;
    for (const line of readFileSync(p, "utf8").split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m) out[m[1]] = m[2];
    }
    return out;
}

export const testEnv = (): Record<string, string> => {
    const file = parseEnvFile(path.join(__dirname, "..", ".env.test"));
    const v = (key: string, fallback: string) =>
        process.env[key] ?? file[key] ?? fallback;

    return {
        NODE_ENV: "test",
        DB_USER: v("DB_USER", "postgres"),
        DB_PASSWORD: v("DB_PASSWORD", "postgres"),
        DB_HOST: v("DB_HOST", "localhost"),
        DB_PORT: v("DB_PORT", "5432"),
        DB_DATABASE: v("DB_DATABASE", "algorym_test"),
        JWT_SECRET: v("JWT_SECRET", randomBytes(48).toString("base64")),
        JWT_REFRESH_SECRET: v("JWT_REFRESH_SECRET", randomBytes(48).toString("base64")),
        ACCESS_TOKEN_EXPIRY: v("ACCESS_TOKEN_EXPIRY", "15m"),
        REFRESH_TOKEN_EXPIRY: v("REFRESH_TOKEN_EXPIRY", "7d"),
    };
};