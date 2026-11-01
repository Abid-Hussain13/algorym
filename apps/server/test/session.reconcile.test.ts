import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/app.js";
import db from "../src/db/pool.js";
import { signupAgent, createSession, futureIso } from "./helpers.js";

describe("Session reconciliation", () => {
    let agent: ReturnType<typeof request.agent>;

    beforeEach(async () => {
        ({ agent } = await signupAgent(app));
    });

    it("finalizes an overdue scheduled session when the list is read", async () => {
        const session = await createSession(agent, {
            mode: "interview",
            scheduled_at: futureIso(),
            duration_minutes: 30,
        });

        await db.query(
            `UPDATE sessions
             SET scheduled_at = now() - interval '2 hours',
                 expires_at = now() - interval '90 minutes'
             WHERE id = $1`,
            [session.id]
        );

        const list = await agent.get("/api/session");
        const listed = list.body.data.sessions.find((s: any) => s.id === session.id);
        expect(listed.status).toBe("expired");

        const detail = await agent.get(`/api/session/${session.id}`);
        expect(detail.body.data.session.status).toBe("expired");
        expect(detail.body.data.session.ended_at).toBeTruthy();
    });

    it("finalizes every overdue scheduled session for the same host", async () => {
        const first = await createSession(agent, {
            mode: "interview",
            scheduled_at: futureIso(48),
            duration_minutes: 30,
        });
        const second = await createSession(agent, {
            mode: "interview",
            scheduled_at: futureIso(72),
            duration_minutes: 30,
        });

        await db.query(
            `UPDATE sessions
             SET scheduled_at = now() - interval '3 hours',
                 expires_at = now() - interval '150 minutes'
             WHERE id = $1`,
            [first.id]
        );
        await db.query(
            `UPDATE sessions
             SET scheduled_at = now() - interval '2 hours',
                 expires_at = now() - interval '90 minutes'
             WHERE id = $1`,
            [second.id]
        );

        const list = await agent.get("/api/session");
        const byId = new Map<string, any>(
            list.body.data.sessions.map((s: any) => [s.id, s] as [string, any])
        );
        expect(byId.get(first.id)?.status).toBe("expired");
        expect(byId.get(second.id)?.status).toBe("expired");

        const live = await db.query("SELECT count(*)::int AS count FROM sessions WHERE status = 'live'");
        expect(live.rows[0].count).toBe(0);
    });

    it("auto-starts a due scheduled session and stamps a missing expiry", async () => {
        const session = await createSession(agent, {
            mode: "interview",
            scheduled_at: futureIso(),
            duration_minutes: 45,
        });

        await db.query(
            `UPDATE sessions
             SET scheduled_at = now() - interval '5 minutes',
                 expires_at = NULL
             WHERE id = $1`,
            [session.id]
        );

        const detail = await agent.get(`/api/session/${session.id}`);
        const reconciled = detail.body.data.session;

        expect(reconciled.status).toBe("live");
        expect(reconciled.started_at).toBeTruthy();
        expect(reconciled.expires_at).toBeTruthy();
        expect(new Date(reconciled.expires_at).getTime()).toBeGreaterThan(Date.now() + 30 * 60_000);
    });

    it("marks an overdue scheduled session with a guest as completed", async () => {
        const session = await createSession(agent, {
            mode: "interview",
            scheduled_at: futureIso(),
            duration_minutes: 30,
        });

        await request(app).post("/api/session/join").send({
            access_token: session.access_token,
            email: "guest@example.com",
            display_name: "Guest",
            consent_to_contact: true,
        });

        await db.query(
            `UPDATE sessions
             SET scheduled_at = now() - interval '2 hours',
                 expires_at = now() - interval '90 minutes'
             WHERE id = $1`,
            [session.id]
        );

        const detail = await agent.get(`/api/session/${session.id}`);
        expect(detail.body.data.session.status).toBe("completed");
    });

    it("refuses code execution in an overdue live session before the cron fires", async () => {
        const session = await createSession(agent, { mode: "practice", duration_minutes: 30 });

        const guest = await request(app).post("/api/session/join").send({
            access_token: session.access_token,
            email: "guest@example.com",
            display_name: "Guest",
            consent_to_contact: true,
        });

        await db.query(`UPDATE sessions SET expires_at = now() - interval '1 minute' WHERE id = $1`, [session.id]);

        const res = await request(app).post("/api/run").send({
            sessionId: session.id,
            participantId: guest.body.data.participant.id,
            code: "print(1)",
            language: "python",
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Session is not live");
    });

    it("restarts the expiry window when a scheduled session is started manually", async () => {
        const session = await createSession(agent, {
            mode: "interview",
            scheduled_at: futureIso(),
            duration_minutes: 30,
        });

        const before = Date.now();
        const started = await agent.patch(`/api/session/${session.id}/start`);
        expect(started.status).toBe(200);

        const expiresAt = new Date(started.body.data.session.expires_at).getTime();
        expect(expiresAt).toBeGreaterThanOrEqual(before + 29 * 60_000);
        expect(expiresAt).toBeLessThanOrEqual(Date.now() + 31 * 60_000);
    });
});
