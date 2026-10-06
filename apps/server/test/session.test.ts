import request from "supertest";
// agent type = request.agent(app) return type
import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/app.js";
import { signupAgent, createQuestion, createSession, uniqueEmail, futureIso } from "./helpers.js";
import db from "../src/db/pool.js";

describe("Session", () => {
    let agent: ReturnType<typeof request.agent>;
    let user: { id: string; name: string; email: string };

    beforeEach(async () => {
        ({ agent, user } = await signupAgent(app));
    });

    const liveSession = async () => createSession(agent, { mode: "practice" });

    describe("POST /api/session", () => {
        it("creates a live session", async () => {
            const res = await agent.post("/api/session").send({ mode: "practice" });
            expect(res.status).toBe(201);
            expect(res.body.data.session.status).toBe("live");
            expect(res.body.data.session.mode).toBe("practice");
            expect(res.body.data.session.access_token).toBeTruthy();
            expect(res.body.data.session.started_at).toBeTruthy();
            expect(res.body.data.session.duration_minutes).toBeNull();
        });

        /**
         * The invariant that was silently broken: an immediate session used to be
         * written with `scheduled_at = now()`, which made every instant session
         * look booked and made this assertion impossible to even write.
         */
        it("leaves scheduled_at null for an immediate session", async () => {
            const res = await agent.post("/api/session").send({ mode: "practice" });
            expect(res.status).toBe(201);
            expect(res.body.data.session.scheduled_at).toBeNull();
        });

        it("refuses a second live session for the same host", async () => {
            const first = await agent.post("/api/session").send({ mode: "practice" });
            expect(first.status).toBe(201);

            const second = await agent.post("/api/session").send({ mode: "practice" });
            expect(second.status).toBe(409);
            expect(second.body.message).toMatch(/current live session/i);
        });

        it("allows a new live session once the first is completed", async () => {
            const first = await agent.post("/api/session").send({ mode: "practice" });
            await agent.patch(`/api/session/${first.body.data.session.id}/complete`).send({});

            const second = await agent.post("/api/session").send({ mode: "practice" });
            expect(second.status).toBe(201);
        });

        it("rejects a scheduled_at in the past", async () => {
            const res = await agent.post("/api/session").send({
                mode: "interview",
                scheduled_at: new Date(Date.now() - 60_000).toISOString(),
                duration_minutes: 30,
            });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/future/i);
        });

        it("blocks scheduling on top of the live session's own window", async () => {
            await agent.post("/api/session").send({ mode: "practice", duration_minutes: 60 });
            const inside = new Date(Date.now() + 10 * 60_000).toISOString();
            const res = await agent.post("/api/session").send({
                mode: "interview",
                scheduled_at: inside,
                duration_minutes: 30,
            });
            expect(res.status).toBe(409);
        });

        it("creates a scheduled session with duration", async () => {
            // Captured once: `futureIso()` is `Date.now()`-derived, so calling it
            // twice would differ by a few milliseconds and fail the equality.
            const when = futureIso();
            const res = await agent.post("/api/session").send({
                mode: "interview",
                scheduled_at: when,
                duration_minutes: 45,
            });
            expect(res.status).toBe(201);
            expect(res.body.data.session.status).toBe("scheduled");
            expect(res.body.data.session.duration_minutes).toBe(45);
            expect(res.body.data.session.scheduled_at).toBe(when);
            expect(res.body.data.session.expires_at).toBeTruthy();
        });

        it("registers the host as a participant with display name", async () => {
            const session = await liveSession();
            const { rows } = await db.query(
                `SELECT role, display_name, email FROM session_participants WHERE session_id = $1`,
                [session.id]
            );
            expect(rows).toHaveLength(1);
            expect(rows[0].role).toBe("host");
            expect(rows[0].display_name).toBe("Test User");
            expect(rows[0].email).toBe(user.email);
        });

        it("rejects a session shorter than 10 minutes", async () => {
            const res = await agent.post("/api/session").send({ mode: "practice", duration_minutes: 5 });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("requires a valid mode", async () => {
            const res = await agent.post("/api/session").send({ mode: "weird" });
            expect(res.status).toBe(400);
        });
    });

    describe("GET /api/session", () => {
        it("lists own sessions with pagination", async () => {
            // Only one session may be live at a time, so the second is completed
            // first — the listing should include both regardless of status.
            const s1 = await liveSession();
            await agent.patch(`/api/session/${s1.id}/complete`).send({});
            const s2 = await liveSession();

            const res = await agent.get("/api/session");
            expect(res.status).toBe(200);
            const ids = res.body.data.sessions.map((s: any) => s.id);
            expect(ids).toContain(s1.id);
            expect(ids).toContain(s2.id);
            expect(res.body.data.pagination.total).toBe(2);
            expect(res.body.data.sessions[0].rating).toBeNull();
        });

        it("does not leak other users' sessions", async () => {
            await liveSession();
            const other = await signupAgent(app);
            await createSession(other.agent, { mode: "practice" });

            const res = await agent.get("/api/session");
            expect(res.body.data.pagination.total).toBe(1);
        });

        it("filters by status", async () => {
            await liveSession();
            const other = await signupAgent(app);
            await createSession(other.agent, { mode: "practice" });

            const res = await agent.get("/api/session?status=live");
            expect(res.status).toBe(200);
            expect(res.body.data.sessions.every((s: any) => s.status === "live")).toBe(true);
        });
    });

    describe("GET /api/session/:id", () => {
        it("returns the session", async () => {
            const s = await liveSession();
            const res = await agent.get(`/api/session/${s.id}`);
            expect(res.status).toBe(200);
            expect(res.body.data.session.id).toBe(s.id);
        });

        it("returns 404 for another user's session", async () => {
            const s = await liveSession();
            const other = await signupAgent(app);
            const res = await other.agent.get(`/api/session/${s.id}`);
            expect(res.status).toBe(404);
        });

        it("returns 400 for a malformed id", async () => {
            const res = await agent.get("/api/session/not-an-id");
            expect(res.status).toBe(400);
        });
    });

    describe("PATCH /api/session/:id (update)", () => {
        it("updates a scheduled session", async () => {
            const s = await createSession(agent, {
                mode: "interview",
                scheduled_at: futureIso(),
                duration_minutes: 45,
            });
            const res = await agent.patch(`/api/session/${s.id}`).send({ duration_minutes: 60 });
            expect(res.status).toBe(200);
            expect(res.body.data.session.duration_minutes).toBe(60);
        });

        it("cannot update a live session", async () => {
            const s = await liveSession();
            const res = await agent.patch(`/api/session/${s.id}`).send({ mode: "interview" });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Can only update sessions that are scheduled");
        });
    });

    describe("session lifecycle", () => {
        it("start: only scheduled sessions can be started", async () => {
            const s = await createSession(agent, {
                mode: "interview",
                scheduled_at: futureIso(),
            });
            const started = await agent.patch(`/api/session/${s.id}/start`);
            expect(started.status).toBe(200);
            expect(started.body.data.session.status).toBe("live");
            expect(started.body.data.session.started_at).toBeTruthy();

            // live session cannot be started again
            const again = await agent.patch(`/api/session/${s.id}/start`);
            expect(again.status).toBe(400);
            expect(again.body.message).toBe("Session is not scheduled");
        });

        it("complete: only live sessions can be completed", async () => {
            const s = await createSession(agent, { scheduled_at: futureIso() });
            expect((await agent.patch(`/api/session/${s.id}/complete`)).status).toBe(400);

            const s2 = await liveSession();
            const done = await agent.patch(`/api/session/${s2.id}/complete`);
            expect(done.status).toBe(200);
            expect(done.body.data.session.status).toBe("completed");
        });

        it("cancel: scheduled and live sessions can be cancelled, closed ones cannot", async () => {
            // live → cancelled is allowed, and stamps ended_at because it ran
            const live = await liveSession();
            const cancelledLive = await agent.patch(`/api/session/${live.id}/cancel`);
            expect(cancelledLive.status).toBe(200);
            expect(cancelledLive.body.data.session.status).toBe("cancelled");
            expect(cancelledLive.body.data.session.ended_at).toBeTruthy();

            // scheduled → cancelled, and started_at is null so ended_at stays null
            const scheduled = await createSession(agent, { scheduled_at: futureIso() });
            const cancelled = await agent.patch(`/api/session/${scheduled.id}/cancel`);
            expect(cancelled.status).toBe(200);
            expect(cancelled.body.data.session.status).toBe("cancelled");
            expect(cancelled.body.data.session.ended_at).toBeNull();

            // already closed → rejected
            expect((await agent.patch(`/api/session/${cancelled.body.data.session.id}/cancel`)).status).toBe(400);

            const completed = await liveSession();
            await agent.patch(`/api/session/${completed.id}/complete`);
            expect((await agent.patch(`/api/session/${completed.id}/cancel`)).status).toBe(400);
        });
    });

    describe("POST /api/session/join", () => {
        it("lets a guest join a live session by access token", async () => {
            const s = await liveSession();
            const res = await request(app).post("/api/session/join").send({
                access_token: s.access_token,
                email: "guest@example.com",
                display_name: "Candidate",
                consent_to_contact: true,
            });

            expect(res.status).toBe(200);
            expect(res.body.data.session.id).toBe(s.id);
            expect(res.body.data.participant.role).toBe("guest");
            expect(res.body.data.participant.display_name).toBe("Candidate");

            const { rows } = await db.query(
                "SELECT count(*) FROM session_participants WHERE session_id = $1",
                [s.id]
            );
            expect(Number(rows[0].count)).toBe(2); // host + guest
        });

        it("rejects a bogus access token", async () => {
            const res = await request(app).post("/api/session/join").send({
                access_token: "doesnotexist",
                email: "guest@example.com",
                display_name: "Candidate",
                consent_to_contact: true,
            });
            expect(res.status).toBe(404);
        });

        it("rejects joining a completed session", async () => {
            const s = await liveSession();
            await agent.patch(`/api/session/${s.id}/complete`);
            const res = await request(app).post("/api/session/join").send({
                access_token: s.access_token,
                email: "guest@example.com",
                display_name: "Candidate",
                consent_to_contact: true,
            });
            expect(res.status).toBe(400);
        });

        it("requires email and name", async () => {
            const s = await liveSession();
            const res = await request(app).post("/api/session/join").send({
                access_token: s.access_token,
                consent_to_contact: true,
            });
            expect(res.status).toBe(400);
        });
    });

    describe("PATCH /api/session/:id/question", () => {
        it("changes the question on a live session and logs a question_change event", async () => {
            const q = await createQuestion(agent);
            const s = await liveSession();

            const res = await agent.patch(`/api/session/${s.id}/question`).send({ question_id: q.id, language: "python" });
            expect(res.status).toBe(200);
            expect(res.body.data.session.question_id).toBe(q.id);

            const { rows } = await db.query(
                `SELECT payload FROM session_events WHERE session_id = $1 AND event_type = 'question_change'`,
                [s.id]
            );
            expect(rows).toHaveLength(1);
            expect(rows[0].payload.title).toBe("Two Sum");
        });

        it("cannot change question on a non-live session", async () => {
            const q = await createQuestion(agent);
            const s = await createSession(agent, { scheduled_at: futureIso() });
            const res = await agent.patch(`/api/session/${s.id}/question`).send({ question_id: q.id, language: "python" });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Can only change question in a live session");
        });
    });

    describe("DELETE /api/session/:id", () => {
        it("deletes own session (204)", async () => {
            const s = await liveSession();
            const res = await agent.delete(`/api/session/${s.id}`);
            expect(res.status).toBe(204);
            expect((await agent.get(`/api/session/${s.id}`)).status).toBe(404);
        });

        it("cannot delete another user's session", async () => {
            const s = await liveSession();
            const other = await signupAgent(app);
            expect((await other.agent.delete(`/api/session/${s.id}`)).status).toBe(404);
        });
    });

    describe("auth guard", () => {
        it("rejects unauthenticated traffic", async () => {
            const anon = request(app);
            expect((await anon.get("/api/session")).status).toBe(401);
            expect((await anon.post("/api/session").send({})).status).toBe(401);
        });
    });
});