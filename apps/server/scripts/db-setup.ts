/**
 * Creates a fresh database from `src/db/schema.sql`.
 *
 * Run it:
 *     pnpm --filter server db:setup
 *     pnpm --filter server db:setup --force     # drops existing tables first
 *
 * Safety is the whole point of this existing as a script rather than a README
 * line. `schema.sql` issues plain `CREATE TABLE`, so running it against a
 * populated database fails halfway and leaves a mess. This refuses up front and
 * tells you what it found, instead.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { Client } from "pg";
import { buildClientConfig, describeTarget, hasDatabaseConfig } from "../src/utils/dbConnection.js";

dotenv.config();

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(here, "..", "src", "db", "schema.sql");

const force = process.argv.includes("--force");

const config = buildClientConfig();

if (!hasDatabaseConfig()) {
    console.error(
        "No database configured.\n" +
            "  Set DATABASE_URL (Supabase) or DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_DATABASE."
    );
    process.exit(1);
}

console.log(`Target: ${describeTarget(config)}`);

const client = new Client(config);

try {
    await client.connect();
} catch (err) {
    console.error(`\nCould not connect: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
}

try {
    // Is anything already there? One round trip on the app's own table is enough.
    const existing = await client.query(
        `SELECT count(*)::int AS count
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN ('users', 'sessions')`
    );

    if ((existing.rows[0]?.count ?? 0) > 0) {
        if (!force) {
            // Must stop here, not merely set an exit code: falling through would
            // apply the schema anyway, fail halfway on the first existing type,
            // and leave the database in a worse state than before.
            console.error(
                "\nThis database already has Algorym tables in it.\n" +
                    "  Re-run with --force to DROP and recreate them (this deletes all data)."
            );
            await client.end();
            process.exit(1);
        }

        console.log("\n--force: dropping existing objects…");
        // CASCADE so foreign keys between our own tables cannot block the drop.
        // Enums go with the tables that use them.
        await client.query(`
            drop table if exists
                session_questions, session_evaluations, session_events,
                session_participants, sessions, user_preferences,
                tokens, questions, users
            cascade;
            drop type if exists
                difficulty_level, session_mode, session_status, event_type,
                evaluation_rating, participant_role, token_type
            cascade;
        `);
    }

    const schema = await readFile(SCHEMA_PATH, "utf8");
    // No parameters, so `pg` uses the simple query protocol and the whole file
    // executes as one batch — exactly what psql -f would do.
    await client.query(schema);

    console.log("\nSchema applied. Tables now present:");
    const tables = await client.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
         ORDER BY table_name`
    );
    for (const row of tables.rows) console.log(`  ${row.table_name}`);
} catch (err) {
    console.error(`\nFailed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
} finally {
    await client.end();
}