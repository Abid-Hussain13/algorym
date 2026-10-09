import "dotenv/config";
import { Pool } from "pg";
import { buildPoolConfig, describeTarget } from "../utils/dbConnection.js";

/**
 * Connection settings live in `utils/dbConnection.ts`, shared with the
 * `db:setup` / `db:seed` scripts so the app and the tooling can never disagree
 * about which database they are on.
 */
const db = new Pool(buildPoolConfig());

// An idle-client error (the host closing a stale connection) is emitted on the
// pool rather than on a query. Without a listener Node treats it as an unhandled
// 'error' event and kills the process.
db.on("error", (err) => {
    console.error("[db] idle client error", err.message);
});

db.query("SELECT 1")
    .then(() => console.log(`Database connected: ${describeTarget(buildPoolConfig())}`))
    .catch((err) => {
        // A failed boot here is a configuration problem. Saying so at startup
        // beats an obscure "connection terminated" on the first request.
        console.error(
            `[db] could not connect: ${err instanceof Error ? err.message : String(err)}\n` +
                `     Set DATABASE_URL (Supabase) or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_DATABASE (local).`
        );
    });

export default db;