import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
// agent type = request.agent(app) return type
import app from "../src/app.js";
import { signupAgent, createSession } from "./helpers.js";
import db from "../src/db/pool.js";

describe("Session evaluation", () => {
    let agent: ReturnType<typeof request.agent>;

    beforeEach(async () => {
        ({ agent } = await signupAgent(app));
    });

    const getToken = async (sessionId: string) =>
        (await db.query<{ access_token: string }>("SELECT access_token FROM sessions WHERE id = $1", [sessionId]))
            .rows[0].access_token;

    const joinGuest = async (sessionId: string, display = "Candidate") => {
        const res = await request(app).post("/api/session/join").send({
            access_token: await getToken(sessionId),
            email: `cand_${Date.now()}_${Math.random()}@example.com`,
            display_name: display,
            consent_to_contact: true,
        });
        if (res.status !== 200) throw new Error(`join failed ${res.status}`);
        return res.body.participant as { id: string };
    };

    const setupCompletedInterview = async () => {
        const session = await createSession(agent, { mode: "interview" });
        const guest = await joinGuest(session.id);
        await agent.patch(`/api/session/${session.id}/complete`);
        return { session, guest };
    };

    describe("PATCH /api/session/:id/notes", () => {
        it("saves notes on a live session without a rating", async () => {
            const session = await createSession(agent, { mode: "interview" });
            const guest = await joinGuest(session.id);

            const res = await agent.patch(`/api/session/${session.id}/notes`).send({
                notes: "Struggled with edge cases, good approach.",
            });
            expect(res.status).toBe(200);
            expect(res.body.evaluation.notes).toBe("Struggled with edge cases, good approach.");
            expect(res.body.evaluation.rating).toBeNull();
            expect(res.body.evaluation.evaluated_participant_id).toBe(guest.id);
        });

        it("upserts into the same row when notes are updated", async () => {
            const session = await createSession(agent, { mode: "interview" });
            await joinGuest(session.id);

            await agent.patch(`/api/session/${session.id}/notes`).send({ notes: "first draft" });
            const res = await agent.patch(`/api/session/${session.id}/notes`).send({ notes: "second draft" });
            expect(res.status).toBe(200);
            expect(res.body.evaluation.notes).toBe("second draft");

            const { rows } = await db.query("SELECT count(*) FROM session_evaluations WHERE session_id = $1", [
                session.id,
            ]);
            expect(Number(rows[0].count)).toBe(1);
        });

        it("fails when no candidate has joined", async () => {
            const session = await createSession(agent, { mode: "interview" });
            const res = await agent.patch(`/api/session/${session.id}/notes`).send({ notes: "x" });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("No candidate has joined this session yet");
        });

        it("rejects notes on a scheduled session", async () => {
            const session = await createSession(agent, {
                mode: "interview",
                scheduled_at: "2026-09-01T10:00:00.000Z",
            });
            const res = await agent.patch(`/api/session/${session.id}/notes`).send({ notes: "x" });
            expect(res.status).toBe(409);
        });
    });

    describe("GET /api/session/:id/evaluation", () => {
        it("returns null when there is no evaluation yet", async () => {
            const session = await createSession(agent, { mode: "interview" });
            const res = await agent.get(`/api/session/${session.id}/evaluation`);
            expect(res.status).toBe(200);
            expect(res.body.evaluation).toBeNull();
        });

        it("returns saved notes as a draft (pre-fill)", async () => {
            const session = await createSession(agent, { mode: "interview" });
            await joinGuest(session.id);
            await agent.patch(`/api/session/${session.id}/notes`).send({ notes: "draft note" });

            const res = await agent.get(`/api/session/${session.id}/evaluation`);
            expect(res.status).toBe(200);
            expect(res.body.evaluation.notes).toBe("draft note");
            expect(res.body.evaluation.rating).toBeNull();
        });

        it("blocks non-owners", async () => {
            const session = await createSession(agent, { mode: "interview" });
            const other = await signupAgent(app);
            const res = await other.agent.get(`/api/session/${session.id}/evaluation`);
            expect(res.status).toBe(404);
        });
    });

    describe("POST /api/evaluation", () => {
        it("submits a final evaluation with rating and notes", async () => {
            const { session, guest } = await setupCompletedInterview();

            const res = await agent.post("/api/evaluation").send({
                sessionId: session.id,
                participantId: guest.id,
                rating: "strong",
                notes: "Excellent work",
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.result.rating).toBe("strong");
            expect(res.body.result.notes).toBe("Excellent work");
        });

        it("submits evaluation without rating or notes (both optional)", async () => {
            const { session, guest } = await setupCompletedInterview();

            const res = await agent.post("/api/evaluation").send({
                sessionId: session.id,
                participantId: guest.id,
            });

            expect(res.status).toBe(200);
            expect(res.body.result.rating).toBeNull();
        });

        it("persists a single evaluation row after drafts (final submit overwrites notes when omitted)", async () => {
            const { session, guest } = await setupCompletedInterview();
            await agent.patch(`/api/session/${session.id}/notes`).send({ notes: "draft" });
            await agent.post("/api/evaluation").send({
                sessionId: session.id,
                participantId: guest.id,
                rating: "average",
            });

            const { rows } = await db.query("SELECT rating, notes FROM session_evaluations WHERE session_id = $1", [
                session.id,
            ]);
            expect(rows).toHaveLength(1);
            expect(rows[0].rating).toBe("average");
            // NOTE: evaluateUser upsert sets notes = Excluded.notes ("" when omitted),
            // so the draft is replaced. Confirms single-row upsert, not data preservation.
            expect(rows[0].notes).toBe("");
        });

        it("rejects evaluating a live (not completed) session", async () => {
            const session = await createSession(agent, { mode: "interview" });
            const guest = await joinGuest(session.id);

            const res = await agent.post("/api/evaluation").send({
                sessionId: session.id,
                participantId: guest.id,
                rating: "weak",
            });
            expect(res.status).toBe(409);
            expect(res.body.message).toBe("Complete Session before evaluating candidate");
        });

        it("rejects host evaluating themselves", async () => {
            const { session } = await setupCompletedInterview();
            const host = (
                await db.query<{ id: string }>(
                    "SELECT id FROM session_participants WHERE session_id = $1 AND role='host'",
                    [session.id]
                )
            ).rows[0];

            const res = await agent.post("/api/evaluation").send({
                sessionId: session.id,
                participantId: host.id,
            });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Host cannot evaluate themselves");
        });

        it("only allows evaluation on interview-mode sessions", async () => {
            const session = await createSession(agent, { mode: "practice" });
            const guest = await joinGuest(session.id);
            await agent.patch(`/api/session/${session.id}/complete`);

            const res = await agent.post("/api/evaluation").send({
                sessionId: session.id,
                participantId: guest.id,
            });
            expect(res.status).toBe(409);
            expect(res.body.message).toBe("Only interview session can evaluate user");
        });
    });
});