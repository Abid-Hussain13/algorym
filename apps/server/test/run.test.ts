import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { signupAgent, createSession } from "./helpers.js";
import db from "../src/db/pool.js";

// Mock the external SandboxAPI so tests never hit the network / paid API
vi.mock("../src/services/code-run.service.js", () => ({
    runCode: vi.fn(async () => ({
        language: "python",
        stdout: "5\n",
        stderr: "",
        compile_output: "",
        time: 0.02,
        memory: 5120,
        status: "accepted",
        exit_code: 0,
    })),
    getRuntimes: vi.fn(async () => []),
}));

const joinGuest = async (sessionId: string) => {
    const session = (
        await db.query<{ access_token: string }>("SELECT access_token FROM sessions WHERE id = $1", [sessionId])
    ).rows[0];
    const res = await request(app).post("/api/session/join").send({
        access_token: session.access_token,
        email: "candidate@example.com",
        display_name: "Candidate",
        consent_to_contact: true,
    });
    return res.body.participant as { id: string };
};

describe("POST /api/run", () => {
    it("runs code on a live session and persists a run_result event", async () => {
        const { agent } = await signupAgent(app);
        const session = await createSession(agent, { mode: "practice" });
        const guest = await joinGuest(session.id);

        const res = await request(app).post("/api/run").send({
            sessionId: session.id,
            participantId: guest.id,
            code: "print(5)",
            language: "python",
            stdin: "hello",
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.result.status).toBe("accepted");
        expect(res.body.result.stdout).toBe("5\n");

        // event persisted with stdin + code for the replay
        const { rows } = await db.query(
            `SELECT payload FROM session_events WHERE session_id = $1 AND event_type = 'run_result'`,
            [session.id]
        );
        expect(rows).toHaveLength(1);
        expect(rows[0].payload.stdin).toBe("hello");
        expect(rows[0].payload.code).toBe("print(5)");
        expect(rows[0].payload.status).toBe("accepted");
    });

    it("rejects runs on sessions that are not live", async () => {
        const { agent } = await signupAgent(app);
        const session = await createSession(agent, {
            mode: "practice",
            scheduled_at: "2026-09-01T10:00:00.000Z",
        });
        const guest = await joinGuest(session.id);

        const res = await request(app).post("/api/run").send({
            sessionId: session.id,
            participantId: guest.id,
            code: "x",
            language: "python",
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Session is not live");
    });

    it("rejects a participant that is not in the session", async () => {
        const { agent } = await signupAgent(app);
        const session = await createSession(agent, { mode: "practice" });
        const other = await signupAgent(app);
        const otherSession = await createSession(other.agent, { mode: "practice" });
        const guest = await joinGuest(otherSession.id);

        const res = await request(app).post("/api/run").send({
            sessionId: session.id,
            participantId: guest.id,
            code: "x",
            language: "python",
        });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("You are not a participant of this session");
    });

    it("rejects invalid payload (bad language)", async () => {
        const { agent } = await signupAgent(app);
        const session = await createSession(agent, { mode: "practice" });
        const guest = await joinGuest(session.id);

        const res = await request(app).post("/api/run").send({
            sessionId: session.id,
            participantId: guest.id,
            code: "x",
            language: "ruby",
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Validation failed");
    });

    it("rejects empty code", async () => {
        const { agent } = await signupAgent(app);
        const session = await createSession(agent, { mode: "practice" });
        const guest = await joinGuest(session.id);

        const res = await request(app).post("/api/run").send({
            sessionId: session.id,
            participantId: guest.id,
            code: "",
            language: "python",
        });
        expect(res.status).toBe(400);
    });
});