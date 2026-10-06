import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { signupAgent, createSession, createQuestion } from "./helpers.js";
import db from "../src/db/pool.js";

const accessTokenFor = async (sessionId: string) => {
    const { rows } = await db.query<{ access_token: string }>(
        "SELECT access_token FROM sessions WHERE id = $1",
        [sessionId]
    );
    return rows[0].access_token;
};

/** Joins as a completely anonymous guest — no cookie, no account. */
const joinAnonymously = async (sessionId: string) => {
    const res = await request(app).post("/api/session/join").send({
        access_token: await accessTokenFor(sessionId),
        email: "candidate@example.com",
        display_name: "Candidate",
        consent_to_contact: true,
    });
    return res.body.data.participant as { id: string; role: string };
};

describe("GET /api/session/:id/room", () => {
    it("returns session + current question to an anonymous guest (no login)", async () => {
        const { agent } = await signupAgent(app);
        const question = await createQuestion(agent, {
            title: "Reverse a String",
            starter_code: { python: "def reverse(s):\n    pass\n" },
        });
        const session = await createSession(agent, {
            mode: "interview",
            question_ids: [question.id],
            language: "python",
        });
        const guest = await joinAnonymously(session.id);

        const res = await request(app).get(`/api/session/${session.id}/room`)
            .query({ participantId: guest.id });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const { session: roomSession, question: roomQuestion } = res.body.data;
        expect(roomSession.id).toBe(session.id);
        expect(roomSession.language).toBe("python");
        expect(roomSession.status).toBe(session.status);
        expect(roomQuestion.title).toBe("Reverse a String");
        expect(roomQuestion.starter_code).toEqual({ python: "def reverse(s):\n    pass\n" });
    });

    it("returns the full assigned question list so a candidate can see what is coming", async () => {
        const { agent } = await signupAgent(app);
        const first = await createQuestion(agent, { title: "Question Alpha" });
        const second = await createQuestion(agent, { title: "Question Beta" });

        const session = await createSession(agent, {
            mode: "interview",
            question_ids: [first.id, second.id],
            language: "javascript",
        });
        const guest = await joinAnonymously(session.id);

        const res = await request(app)
            .get(`/api/session/${session.id}/room`)
            .query({ participantId: guest.id });

        expect(res.status).toBe(200);

        const { questions, question } = res.body.data;
        expect(Array.isArray(questions)).toBe(true);
        expect(questions.map((q: { title: string }) => q.title)).toEqual([
            "Question Alpha",
            "Question Beta",
        ]);
        // position drives the tab order, so it must be present
        expect(questions[0].position).toBeDefined();
        expect(questions[0].id).toBe(first.id);
        // the current question is still returned separately
        expect(question.title).toBe("Question Alpha");
    });

    it("returns an empty list — not an error — when nothing is assigned", async () => {
        const { agent } = await signupAgent(app);
        const session = await createSession(agent, { mode: "interview" });
        const guest = await joinAnonymously(session.id);

        const res = await request(app)
            .get(`/api/session/${session.id}/room`)
            .query({ participantId: guest.id });

        expect(res.status).toBe(200);
        expect(res.body.data.questions).toEqual([]);
    });

    it("never leaks the invite token back to a participant", async () => {
        const { agent } = await signupAgent(app);
        const session = await createSession(agent, { mode: "interview" });
        const guest = await joinAnonymously(session.id);

        const res = await request(app).get(`/api/session/${session.id}/room`)
            .query({ participantId: guest.id });

        expect(res.status).toBe(200);
        expect(res.body.data.session.access_token).toBeUndefined();
        expect(JSON.stringify(res.body)).not.toContain(session.access_token);
    });

    it("returns question: null when the session has no question yet", async () => {
        const { agent } = await signupAgent(app);
        const session = await createSession(agent, { mode: "interview" });
        const guest = await joinAnonymously(session.id);

        const res = await request(app).get(`/api/session/${session.id}/room`)
            .query({ participantId: guest.id });

        expect(res.status).toBe(200);
        expect(res.body.data.question).toBeNull();
    });

    it("403s an unknown session — it does not reveal whether the id exists", async () => {
        const res = await request(app)
            .get("/api/session/00000000-0000-0000-0000-000000000000/room")
            .query({ participantId: "00000000-0000-0000-0000-000000000000" });

        expect(res.status).toBe(403);
    });

    it("400s without a participantId", async () => {
        const { agent } = await signupAgent(app);
        const session = await createSession(agent, { mode: "interview" });

        const res = await request(app).get(`/api/session/${session.id}/room`);

        expect(res.status).toBe(400);
    });

    it("403s a participantId that belongs to another session", async () => {
        const { agent } = await signupAgent(app);
        const sessionA = await createSession(agent, { mode: "interview" });
        // Join while it is still live, then close it: only one live session per
        // host is permitted, so the second has to come after.
        const guestA = await joinAnonymously(sessionA.id);
        await agent.patch(`/api/session/${sessionA.id}/complete`).send({});
        const sessionB = await createSession(agent, { mode: "interview" });

        const res = await request(app).get(`/api/session/${sessionB.id}/room`)
            .query({ participantId: guestA.id });

        expect(res.status).toBe(403);
    });

    it("403s a caller who presents someone else's participantId", async () => {
        const { agent } = await signupAgent(app);
        const session = await createSession(agent, { mode: "interview" });
        const guest = await joinAnonymously(session.id);
        const { agent: attacker } = await signupAgent(app);

        const res = await attacker.get(`/api/session/${session.id}/room`)
            .query({ participantId: guest.id });

        expect(res.status).toBe(403);
    });

    it("lets the host read the room with their own participantId", async () => {
        const { agent } = await signupAgent(app);
        const session = await createSession(agent, { mode: "interview" });
        const question = await createQuestion(agent, { title: "Two Sum" });
        await agent.patch(`/api/session/${session.id}/question`).send({
            question_id: question.id,
            language: "javascript",
        });

        // The host's participantId is only discoverable via the owner-scoped detail.
        const detail = await agent.get(`/api/session/${session.id}`);
        const hostParticipantId = detail.body.data.session.host_participant_id as string;
        expect(hostParticipantId).toBeTruthy();

        const res = await agent.get(`/api/session/${session.id}/room`)
            .query({ participantId: hostParticipantId });

        expect(res.status).toBe(200);
        expect(res.body.data.question.title).toBe("Two Sum");
        expect(res.body.data.session.language).toBe("javascript");
    });
});

describe("focus events (session integrity)", () => {
    it("counts full screen exits and tab-aways per kind on the session detail", async () => {
        const { agent } = await signupAgent(app);
        const question = await createQuestion(agent);
        const session = await createSession(agent, {
            mode: "interview",
            question_ids: [question.id],
        });
        const guest = await joinAnonymously(session.id);
        const guestId = guest.id as string;

        await db.query(
            `INSERT INTO session_events (session_id, actor_participant_id, event_type, payload)
             VALUES ($1, $2, 'focus_event', '{"kind":"fullscreen_exit"}'),
                    ($1, $2, 'focus_event', '{"kind":"fullscreen_exit"}'),
                    ($1, NULL,     'focus_event', '{"kind":"tab_away"}')`,
            [session.id, guestId]
        );

        const res = await agent.get(`/api/session/${session.id}`);
        expect(res.status).toBe(200);
        expect(res.body.data.session.candidate_fullscreen_exits).toBe(2);
        expect(res.body.data.session.candidate_tab_aways).toBe(1);
    });

    it("reports zero for a session where nobody left full screen", async () => {
        const { agent } = await signupAgent(app);
        const question = await createQuestion(agent);
        const session = await createSession(agent, {
            mode: "interview",
            question_ids: [question.id],
        });

        const res = await agent.get(`/api/session/${session.id}`);
        expect(res.status).toBe(200);
        expect(res.body.data.session.candidate_fullscreen_exits).toBe(0);
        expect(res.body.data.session.candidate_tab_aways).toBe(0);
    });

    it("does not leak the counts to a candidate via /room", async () => {
        const { agent } = await signupAgent(app);
        const question = await createQuestion(agent);
        const session = await createSession(agent, {
            mode: "interview",
            question_ids: [question.id],
        });
        const guest = await joinAnonymously(session.id);

        await db.query(
            `INSERT INTO session_events (session_id, event_type, payload)
             VALUES ($1, 'focus_event', '{"kind":"fullscreen_exit"}')`,
            [session.id]
        );

        const res = await request(app)
            .get(`/api/session/${session.id}/room`)
            .query({ participantId: guest.id });

        expect(res.status).toBe(200);
        // Integrity counts are the host's business, not the candidate's.
        expect(JSON.stringify(res.body.data)).not.toContain("fullscreen_exit");
    });
});
