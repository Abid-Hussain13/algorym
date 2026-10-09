/**
 * Loads `src/db/seed.sql` — demo users, questions and sessions for a dashboard
 * that otherwise starts empty.
 *
 * Run it after `db:setup`:
 *     pnpm --filter server db:seed
 *
 * The seed assumes one real account already exists (the "Main user"), because
 * the questions and sessions are owned by it. Without that account the foreign
 * keys fail, so this checks for it first and says so plainly.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { Client } from "pg";
import { buildClientConfig, describeTarget, hasDatabaseConfig } from "../src/utils/dbConnection.js";

dotenv.config();

const here = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = join(here, "..", "src", "db", "seed.sql");

/** The account the seed data belongs to, named in `seed.sql` itself. */
const MAIN_USER_EMAIL = process.env.SEED_MAIN_USER_EMAIL;

const config = buildClientConfig();
if (!hasDatabaseConfig()) {
    console.error(
        "No database configured.\n" +
            "  Set DATABASE_URL (Supabase) or DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_DATABASE."
    );
    process.exit(1);
}

const client = new Client(config);
try {
    await client.connect();
} catch (err) {
    console.error(`\nCould not connect: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
}

try {
    if (MAIN_USER_EMAIL) {
        const owner = await client.query("SELECT id FROM users WHERE email = $1", [
            MAIN_USER_EMAIL,
        ]);
        if (owner.rows.length === 0) {
            console.error(
                `\nNo user with email "${MAIN_USER_EMAIL}" exists, so the seed has no owner to\n` +
                    `attach questions and sessions to. Create that account first:\n\n` +
                    `    curl -X POST <API_URL>/api/auth/signup \\\n` +
                    `      -H 'Content-Type: application/json' \\\n` +
                    `      -d '{"name":"Your Name","email":"${MAIN_USER_EMAIL}","password":"..."}'\n`
            );
            // Stop here rather than letting the inserts fail on a foreign key.
            await client.end();
            process.exit(1);
        }
    }

    const sql = await readFile(SEED_PATH, "utf8");
    await client.query(sql);
    console.log("Seed applied.");
} catch (err) {
    console.error(`\nFailed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
} finally {
    await client.end();
}