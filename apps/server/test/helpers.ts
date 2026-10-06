import request from "supertest";
import type { Express } from "express";

type Agent = ReturnType<typeof request.agent>;

export const uniqueEmail = (prefix = "user") =>
    `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;

export const signupAgent = async (app: Express, name = "Test User") => {
    const agent = request.agent(app);
    const email = uniqueEmail("user");
    const password = "test12345";
    const res = await agent.post("/api/auth/signup").send({ name, email, password });
    if (res.status !== 200) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
    return { agent, user: res.body.data, email, password };
};

export const createQuestion = async (agent: Agent, overrides: Record<string, unknown> = {}) => {
    const res = await agent.post("/api/question").send({
        title: "Two Sum",
        description: "Given an array of integers, return indices of the two numbers that add up to a target.",
        languages: ["python", "javascript"],
        difficulty: "easy",
        ...overrides,
    });
    if (res.status !== 201) throw new Error(`createQuestion failed: ${res.status} ${JSON.stringify(res.body)}`);
    return res.body.data.question;
};

/**
 * A timestamp far enough in the future that the suite cannot rot.
 *
 * These tests used to hardcode `2026-09-01`, which silently became a *past*
 * date. The server now (correctly) rejects scheduling in the past, so every
 * assertion about scheduled sessions broke on the day that date passed. Deriving
 * the value from `Date.now()` is what stops this happening again.
 */
export const futureIso = (hoursAhead = 48): string =>
    new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString();

export const createSession = async (agent: Agent, overrides: Record<string, unknown> = {}) => {
    const res = await agent.post("/api/session").send({ mode: "interview", ...overrides });
    if (res.status !== 201) throw new Error(`createSession failed: ${res.status} ${JSON.stringify(res.body)}`);
    return res.body.data.session;
};