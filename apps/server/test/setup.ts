import { beforeEach } from "vitest";
import db from "../src/db/pool.js";

async function assertDisposableDatabase(): Promise<void> {
    const { rows } = await db.query("SELECT current_database() AS name");
    const name: string = rows[0]?.name ?? "";

    const looksDisposable =
        name.includes("test") ||
        name.startsWith("algorym_setup") ||
        name.startsWith("tmp") ||
        name.startsWith("postgres_");

    if (!looksDisposable) {
        throw new Error(
            [
                "",
                "REFUSING TO RUN TESTS.",
                "",
                `Connected to database "${name}", which does not look like a throwaway.`,
                "Tests TRUNCATE every table before each run, so pointing them at a real",
                "database destroys its contents irreversibly.",
                "",
                "Fix DATABASE_URL (or DB_DATABASE) in .env.test to point at a local",
                "test database, e.g. postgresql://postgres:password@localhost:5432/algorym_test",
                "",
            ].join("\n")
        );
    }
}

beforeEach(async () => {
    await assertDisposableDatabase();
    const queryString = `TRUNCATE users, questions, sessions, session_participants, session_events, session_evaluations CASCADE`;
    await db.query(queryString);
});
