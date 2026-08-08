import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
// agent type = request.agent(app) return type
import app from "../src/app.js";
import { signupAgent, createQuestion, createSession } from "./helpers.js";
import db from "../src/db/pool.js";

describe("Session replay events (GET /api/session/:id/events)", () => {
    let agent: ReturnType<typeof request.agent>;
    let user: { id: string };

    beforeEach(async () => {
        ({ agent, user } = await signupAgent(app));
    });

    const insertEvent = async (sessionId: string, eventType: string, payload: Record<string, unknown> = {}) => {
        const host = await db.query<{ id: string }>(
            "SELECT id FROM session_participants WHERE session_id = $1 AND role = 'host'",
            [sessionId]
        );
        await db.query(
            "INSERT INTO session_events (session_id, actor_participant_id, event_type, payload) VALUES ($1,$2,$3,$4)",
            [sessionId, host.rows[0].id, eventType, JSON.stringify(payload)]
        );
    };

    it("returns events in chronological (ASC) order with actor info", async () => {
        const session = await createSession(agent, { mode: "practice" });
        await insertEvent(session.id, "session_started", { note: "start" });
        await insertEvent(session.id, "code_snapshot", { code: "print('hi')" });

        const res = await agent.get(`/api/session/${session.id}/events`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const events = res.body.sessionEvents;
        expect(events).toHaveLength(2);
        expect(events[0].event_type).toBe("session_started");
        expect(events[1].event_type).toBe("code_snapshot");
        // ASC = start comes before snapshot
        expect(new Date(events[0].created_at).getTime()).toBeLessThanOrEqual(
            new Date(events[1].created_at).getTime()
        );

        // actor joined with display name + role
        expect(events[0].actor).toMatchObject({ role: "host", display_name: "Test User" });
        expect(events[0].actor.id).toBeTruthy();
    });

    it("returns question_change payload with question details", async () => {
        const q = await createQuestion(agent);
        const session = await createSession(agent, { mode: "practice" });
        await agent.patch(`/api/session/${session.id}/question`).send({ question_id: q.id });

        const res = await agent.get(`/api/session/${session.id}/events`);
        const qc = res.body.sessionEvents.find((e: any) => e.event_type === "question_change");
        expect(qc).toBeDefined();
        expect(qc.payload.title).toBe("Two Sum");
        expect(qc.payload.question_id).toBe(q.id);
    });

    it("returns run_result payload including stdin and code", async () => {
        const session = await createSession(agent, { mode: "practice" });
        await insertEvent(session.id, "run_result", {
            status: "accepted",
            stdout: "5",
            stdin: "input here",
            code: "print(5)",
        });

        const res = await agent.get(`/api/session/${session.id}/events`);
        const rr = res.body.sessionEvents.find((e: any) => e.event_type === "run_result");
        expect(rr.payload).toMatchObject({ status: "accepted", stdout: "5", stdin: "input here", code: "print(5)" });
    });

    it("exposes lifecycle events (session_completed) via replay", async () => {
        const session = await createSession(agent, { mode: "practice" });
        await agent.patch(`/api/session/${session.id}/complete`);

        const res = await agent.get(`/api/session/${session.id}/events`);
        const types = res.body.sessionEvents.map((e: any) => e.event_type);
        expect(types).toContain("session_completed");
    });

    it("returns empty array when no events exist", async () => {
        const session = await createSession(agent, { mode: "practice" });
        const res = await agent.get(`/api/session/${session.id}/events`);
        expect(res.status).toBe(200);
        expect(res.body.sessionEvents).toEqual([]);
    });

    it("blocks non-owners with 404", async () => {
        const session = await createSession(agent, { mode: "practice" });
        const other = await signupAgent(app);
        const res = await other.agent.get(`/api/session/${session.id}/events`);
        expect(res.status).toBe(404);
    });

    it("returns 400 for a malformed session id", async () => {
        const res = await agent.get("/api/session/not-a-uuid/events");
        expect(res.status).toBe(400);
    });

    it("is protected", async () => {
        const res = await request(app).get("/api/session/00000000-0000-4000-8000-000000000000/events");
        expect(res.status).toBe(401);
    });
});