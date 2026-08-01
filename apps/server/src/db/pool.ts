import "dotenv/config";
import { Pool } from 'pg';

const db = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_DATABASE
});

db.query("SELECT 1").then(() => console.log("Database connected"));

export default db;
