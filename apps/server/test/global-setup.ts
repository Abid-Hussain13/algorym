import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { Pool } from "pg";
import { testEnv } from "./test-env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const env = testEnv();

const DB_USER = env.DB_USER;
const DB_PASSWORD = env.DB_PASSWORD;
const DB_HOST = env.DB_HOST;
const DB_PORT = Number(env.DB_PORT);
const DB_NAME = env.DB_DATABASE;

export default async function globalSetup(): Promise<void> {
    const adminPool = new Pool({
        user: DB_USER,
        password: DB_PASSWORD,
        host: DB_HOST,
        port: DB_PORT,
        database: "postgres",
    });

    const exists = await adminPool.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB_NAME]);
    if (exists.rowCount === 0) {
        await adminPool.query(`CREATE DATABASE ${DB_NAME}`);
    }
    await adminPool.end();

    const testPool = new Pool({
        user: DB_USER,
        password: DB_PASSWORD,
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
    });

    await testPool.query("DROP SCHEMA public CASCADE");
    await testPool.query("CREATE SCHEMA public");

    const schemaPath = path.join(__dirname, "..", "src", "db", "schema.sql");
    const schemaSql = readFileSync(schemaPath, "utf8");
    await testPool.query(schemaSql);
    await testPool.end();
}