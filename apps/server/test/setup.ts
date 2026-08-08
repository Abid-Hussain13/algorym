import { beforeEach } from "vitest";
import db from "../src/db/pool.js";

beforeEach(async () => {
    const queryString = `TRUNCATE users, questions, sessions, session_participants, session_events, session_evaluations CASCADE`;
    await db.query(queryString);
});
