import "dotenv/config";
import { Pool } from "pg";
import { buildPoolConfig, describeTarget } from "../utils/dbConnection.js";

const db = new Pool(buildPoolConfig());

db.on("error", (err) => {
    console.error("[db] idle client error", err.message);
});

db.query("SELECT 1")
    .then(() => console.log(`Database connected: ${describeTarget(buildPoolConfig())}`))
    .catch((err) => {
        console.error(
            `[db] could not connect: ${err instanceof Error ? err.message : String(err)}\n` +
            `     Set DATABASE_URL (Supabase) or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_DATABASE (local).`
        );
    });

export default db;
