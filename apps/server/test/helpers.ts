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
    return { agent, user: res.body.user, email, password };
};

export const createQuestion = async (agent: Agent, overrides: Record<string, unknown> = {}) => {
    const res = await agent.post("/api/question").send({
        title: "Two Sum",
        description: "Given an array of integers, return indices of the two numbers that add up to a target.",
        languages: ["python", "javascript"],
        difficulty: "easy",
        starter_code: "",
        ...overrides,
    });
    if (res.status !== 201) throw new Error(`createQuestion failed: ${res.status} ${JSON.stringify(res.body)}`);
    return res.body.question;
};

export const createSession = async (agent: Agent, overrides: Record<string, unknown> = {}) => {
    const res = await agent.post("/api/session").send({ mode: "interview", ...overrides });
    if (res.status !== 201) throw new Error(`createSession failed: ${res.status} ${JSON.stringify(res.body)}`);
    return res.body.session;
};