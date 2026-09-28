import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { signupAgent, createSession } from "./helpers.js";
import db from "../src/db/pool.js";

const accessTokenFor = async (sessionId: string) => {
    const { rows } = await db.query<{ access_token: string }>(
        "SELECT access_token FROM sessions WHERE id = $1",
        [sessionId]
    );
    return rows[0].access_token;
};

const participantFor = async (sessionId: string, email: string) => {
    const { rows } = await db.query<{ display_name: string; email: string; role: string; consent_to_contact: boolean; user_id: string | null }>(
        "SELECT display_name, email, role, consent_to_contact, user_id FROM session_participants WHERE session_id = $1 AND email = $2",
        [sessionId, email]
    );
    return rows[0];
};

describe("POST /api/session/join", () => {
    it("an authenticated guest joins with consent only — no name or email re-asked", async () => {
        const { agent: hostAgent } = await signupAgent(app);
        const session = await createSession(hostAgent, { mode: "practice" });
        const { agent: guestAgent, user, email } = await signupAgent(app, "Candidate");

        const res = await guestAgent
            .post("/api/session/join")
            .send({ access_token: await accessTokenFor(session.id), consent_to_contact: true });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const participant = res.body.data.participant;
        expect(participant.role).toBe("guest");
        expect(participant.user_id).toBe(user.id);
        // identity is taken from the account, not the request body
        expect(participant.display_name).toBe("Candidate");
        expect(participant.email).toBe(email);
        expect(participant.consent_to_contact).toBe(true);
    });

    it("ignores any name/email sent by an authenticated guest", async () => {
        const { agent: hostAgent } = await signupAgent(app);
        const session = await createSession(hostAgent, { mode: "practice" });
        const { agent: guestAgent, user } = await signupAgent(app, "Real Name");

        const res = await guestAgent
            .post("/api/session/join")
            .send({
                access_token: await accessTokenFor(session.id),
                display_name: "Spoofed Name",
                email: "spoofed@example.com",
                consent_to_contact: true,
            });

        expect(res.status).toBe(200);
        const stored = await participantFor(session.id, user.email);
        expect(stored.display_name).toBe("Real Name");
        expect(stored.email).toBe(user.email);
    });

    it("still requires name and email from an anonymous guest", async () => {
        const { agent: hostAgent } = await signupAgent(app);
        const session = await createSession(hostAgent, { mode: "practice" });

        const noEmail = await request(app)
            .post("/api/session/join")
            .send({ access_token: await accessTokenFor(session.id), consent_to_contact: true });
        expect(noEmail.status).toBe(400);
        expect(noEmail.body.message).toBe("Email is required to join a session");

        const noName = await request(app)
            .post("/api/session/join")
            .send({ access_token: await accessTokenFor(session.id), email: "anon@example.com", consent_to_contact: true });
        expect(noName.status).toBe(400);
        expect(noName.body.message).toBe("Name is required to join a session");
    });

    it("accepts an anonymous guest who supplies name and email, and records declined consent", async () => {
        const { agent: hostAgent } = await signupAgent(app);
        const session = await createSession(hostAgent, { mode: "practice" });

        const res = await request(app).post("/api/session/join").send({
            access_token: await accessTokenFor(session.id),
            email: "anon@example.com",
            display_name: "Anon",
            consent_to_contact: false,
        });

        expect(res.status).toBe(200);
        expect(res.body.data.participant.role).toBe("guest");
        expect(res.body.data.participant.user_id).toBeNull();
        // consent is stored exactly as given — never defaulted to true
        expect(res.body.data.participant.consent_to_contact).toBe(false);
    });

    it("rejects a second join by the same authenticated user", async () => {
        const { agent: hostAgent } = await signupAgent(app);
        const session = await createSession(hostAgent, { mode: "practice" });
        const { agent: guestAgent } = await signupAgent(app);
        const token = await accessTokenFor(session.id);

        const first = await guestAgent
            .post("/api/session/join")
            .send({ access_token: token, consent_to_contact: true });
        expect(first.status).toBe(200);

        const second = await guestAgent
            .post("/api/session/join")
            .send({ access_token: token, consent_to_contact: true });
        expect(second.status).toBe(400);
        expect(second.body.message).toBe("You have already joined this session");
    });

    it("rejects the host trying to join as a guest", async () => {
        const { agent: hostAgent } = await signupAgent(app);
        const session = await createSession(hostAgent, { mode: "practice" });

        const res = await hostAgent
            .post("/api/session/join")
            .send({ access_token: await accessTokenFor(session.id), consent_to_contact: true });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("You have already joined this session");
    });

    it("rejects an unknown access token", async () => {
        await signupAgent(app);
        const res = await request(app)
            .post("/api/session/join")
            .send({ access_token: "does-not-exist", email: "a@b.com", display_name: "A", consent_to_contact: true });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Session not found");
    });

    it("allows joining a scheduled session but not a cancelled one", async () => {
        const { agent: hostAgent } = await signupAgent(app);

        const scheduled = await createSession(hostAgent, {
            mode: "practice",
            scheduled_at: "2026-09-01T10:00:00.000Z",
        });
        const ok = await request(app)
            .post("/api/session/join")
            .send({ access_token: await accessTokenFor(scheduled.id), email: "a@b.com", display_name: "A", consent_to_contact: true });
        expect(ok.status).toBe(200);

        const closable = await createSession(hostAgent, {
            mode: "practice",
            scheduled_at: "2026-09-02T10:00:00.000Z",
        });
        const cancelled = await hostAgent.patch(`/api/session/${closable.id}/cancel`);
        expect(cancelled.status).toBe(200);
        expect(cancelled.body.data.session.status).toBe("cancelled");

        const rejected = await request(app)
            .post("/api/session/join")
            .send({ access_token: await accessTokenFor(closable.id), email: "c@d.com", display_name: "C", consent_to_contact: true });
        expect(rejected.status).toBe(400);
        expect(rejected.body.message).toBe("Session is not open for joining");
    });

    it("requires an access token", async () => {
        await signupAgent(app);
        const res = await request(app)
            .post("/api/session/join")
            .send({ email: "a@b.com", display_name: "A", consent_to_contact: true });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Validation failed");
    });
});
