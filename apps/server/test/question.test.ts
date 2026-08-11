import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/app.js";
import { signupAgent, createQuestion, uniqueEmail } from "./helpers.js";

describe("Question", () => {
    let agent: ReturnType<typeof request.agent>;

    beforeEach(async () => {
        ({ agent } = await signupAgent(app));
    });

    describe("POST /api/question", () => {
        it("creates a question", async () => {
            const res = await agent.post("/api/question").send({
                title: "Two Sum",
                description: "Find the indices",
                languages: ["python"],
                difficulty: "easy",
            });

            expect(res.status).toBe(201);
            expect(res.body.question).toMatchObject({
                title: "Two Sum",
                description: "Find the indices",
                languages: ["python"],
                difficulty: "easy",
            });
            expect(res.body.question).toHaveProperty("id");
            expect(res.body.question.owner_id).toBeDefined();
        });

        it("rejects missing title with 400", async () => {
            const res = await agent.post("/api/question").send({
                description: "x",
                languages: ["python"],
                difficulty: "easy",
            });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("rejects invalid difficulty with 400", async () => {
            const res = await agent.post("/api/question").send({
                title: "T",
                description: "x",
                languages: ["python"],
                difficulty: "impossible",
            });
            expect(res.status).toBe(400);
        });

        it("rejects empty languages array with 400", async () => {
            const res = await agent.post("/api/question").send({
                title: "T",
                description: "x",
                languages: [],
                difficulty: "easy",
            });
            expect(res.status).toBe(400);
        });
    });

    describe("GET /api/question", () => {
        it("lists only the owner's questions (newest first)", async () => {
            const q1 = await createQuestion(agent, { title: "First" });
            const q2 = await createQuestion(agent, { title: "Second" });

            const res = await agent.get("/api/question");
            expect(res.status).toBe(200);
            expect(res.body.count).toBe(2);
            expect(res.body.questions.map((q: any) => q.id)).toContain(q1.id);
            expect(res.body.questions.map((q: any) => q.id)).toContain(q2.id);
            // newest first
            expect(res.body.questions[0].id).toBe(q2.id);
        });

        it("does not leak other users' questions", async () => {
            await createQuestion(agent, { title: "Mine" });
            const other = await signupAgent(app);
            await createQuestion(other.agent, { title: "Theirs" });

            const res = await agent.get("/api/question");
            expect(res.status).toBe(200);
            expect(res.body.questions).toHaveLength(1);
            expect(res.body.questions[0].title).toBe("Mine");
        });
    });

    describe("GET /api/question/:id", () => {
        it("returns the question by id", async () => {
            const q = await createQuestion(agent);
            const res = await agent.get(`/api/question/${q.id}`);
            expect(res.status).toBe(200);
            expect(res.body.question.id).toBe(q.id);
        });

        it("returns 404 for a valid but nonexistent id", async () => {
            const res = await agent.get("/api/question/00000000-0000-4000-8000-000000000000");
            expect(res.status).toBe(404);
        });

        it("returns 404 for another owner's question", async () => {
            const q = await createQuestion(agent);
            const other = await signupAgent(app);
            const res = await other.agent.get(`/api/question/${q.id}`);
            expect(res.status).toBe(404);
        });

        it("returns 400 for a malformed uuid", async () => {
            const res = await agent.get("/api/question/not-a-real-uuid");
            expect(res.status).toBe(400);
        });
    });

    describe("PUT /api/question/:id", () => {
        it("updates the question", async () => {
            const q = await createQuestion(agent);
            const res = await agent.put(`/api/question/${q.id}`).send({
                title: "Renamed",
                description: "New desc",
                languages: ["cpp"],
                difficulty: "hard",
            });

            expect(res.status).toBe(200);
            expect(res.body.question).toMatchObject({ title: "Renamed", difficulty: "hard", languages: ["cpp"] });
        });

        it("returns 404 for another owner's question", async () => {
            const q = await createQuestion(agent);
            const other = await signupAgent(app);
            const res = await other.agent.put(`/api/question/${q.id}`).send({
                title: "Hijack",
                description: "x",
                languages: ["python"],
                difficulty: "easy",
            });
            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /api/question/:id", () => {
        it("deletes the question (204)", async () => {
            const q = await createQuestion(agent);
            const res = await agent.delete(`/api/question/${q.id}`);
            expect(res.status).toBe(204);

            const check = await agent.get(`/api/question/${q.id}`);
            expect(check.status).toBe(404);
        });

        it("returns 404 for another owner's question", async () => {
            const q = await createQuestion(agent);
            const other = await signupAgent(app);
            const res = await other.agent.delete(`/api/question/${q.id}`);
            expect(res.status).toBe(404);
        });
    });

    describe("auth guard", () => {
        it("rejects unauthenticated requests with 401", async () => {
            const anon = request(app);
            expect((await anon.get("/api/question")).status).toBe(401);
            expect((await anon.post("/api/question").send({})).status).toBe(401);
            expect((await anon.get(`/api/question/${uniqueEmail()}`)).status).toBe(401);
        });
    });
});
