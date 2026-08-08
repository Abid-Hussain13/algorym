import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/app.js";

const uniqueEmail = () => `auth_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;

const validUser = {
    name: "Test User",
    email: uniqueEmail(),
    password: "test12345",
};

describe("POST /api/auth/signup", () => {
    it("creates a user and returns user payload", async () => {
        const res = await request(app)
            .post("/api/auth/signup")
            .send(validUser);

        expect(res.status).toBe(200);
        expect(res.body.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.user).toMatchObject({ name: validUser.name, email: validUser.email });
        expect(res.body.user).toHaveProperty("id");
        expect(res.body.user.password_hash).toBeUndefined();
    });

    it("sets httpOnly auth cookies (accessToken + refreshToken)", async () => {
        const res = await request(app)
            .post("/api/auth/signup")
            .send(validUser);

        const cookies = (res.headers["set-cookie"] ?? []) as unknown as string[];
        const cookieNames = cookies.map((c) => c.split("=")[0]);

        expect(cookieNames).toContain("accessToken");
        expect(cookieNames).toContain("refreshToken");
        expect(cookies.find((c) => c.startsWith("accessToken="))).toMatch(/HttpOnly/i);
        expect(cookies.find((c) => c.startsWith("refreshToken="))).toMatch(/HttpOnly/i);
    });

    it("rejects duplicate email with 409", async () => {
        const res1 = await request(app).post("/api/auth/signup").send(validUser);
        expect(res1.status).toBe(200);

        const res2 = await request(app).post("/api/auth/signup").send(validUser);
        expect(res2.status).toBe(409);
        expect(res2.body.message).toBe("User with this email is already registered");
    });

    it("rejects invalid email with 400 and field errors", async () => {
        const res = await request(app)
            .post("/api/auth/signup")
            .send({ name: "Test", email: "not-an-email", password: "test12345" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Validation failed");
        expect(res.body.errors).toEqual(
            expect.arrayContaining([expect.objectContaining({ field: "email" })])
        );
    });

    it("rejects short password with 400", async () => {
        const res = await request(app)
            .post("/api/auth/signup")
            .send({ name: "Test", email: uniqueEmail(), password: "123" });

        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual(
            expect.arrayContaining([expect.objectContaining({ field: "password" })])
        );
    });

    it("rejects missing name with 400", async () => {
        const res = await request(app)
            .post("/api/auth/signup")
            .send({ email: uniqueEmail(), password: "test12345" });

        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual(
            expect.arrayContaining([expect.objectContaining({ field: "name" })])
        );
    });

    it("stores a bcrypt hash, not plaintext password", async () => {
        await request(app).post("/api/auth/signup").send(validUser);

        const { default: db } = await import("../src/db/pool.js");
        const { rows } = await db.query("SELECT password_hash FROM users WHERE email = $1", [validUser.email]);

        expect(rows[0].password_hash).toBeDefined();
        expect(rows[0].password_hash).not.toBe(validUser.password);
        expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);
    });
});

describe("POST /api/auth/login", () => {
    beforeEach(async () => {
        await request(app).post("/api/auth/signup").send(validUser);
    });

    it("logs in with correct credentials", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: validUser.email, password: validUser.password });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe(validUser.email);

        const cookies = (res.headers["set-cookie"] ?? []) as unknown as string[];
        expect(cookies.find((c) => c.startsWith("accessToken="))).toBeDefined();
        expect(cookies.find((c) => c.startsWith("refreshToken="))).toBeDefined();
    });

    it("rejects wrong password with 401", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: validUser.email, password: "wrong-password" });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("invalid email or password");
    });

    it("rejects unknown email with 401 (no user enumeration)", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "nobody@example.com", password: "whatever123" });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("invalid email or password");
    });

    it("rejects invalid email format with 400", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "bad-email", password: "test12345" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Validation failed");
    });
});

describe("GET /api/auth/me", () => {
    it("returns current user when authenticated", async () => {
        const agent = request.agent(app);
        await agent.post("/api/auth/signup").send(validUser);

        const res = await agent.get("/api/auth/me");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe(validUser.email);
        expect(res.body.user).toHaveProperty("id");
    });

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Not authenticated");
    });

    it("returns 401 with a garbage/invalid token", async () => {
        const res = await request(app)
            .get("/api/auth/me")
            .set("Cookie", "accessToken=garbage.token.value");

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Invalid token");
    });

    it("returns 401 with an expired access token", async () => {
        const jwt = await import("jsonwebtoken");
        const expiredToken = jwt.sign({ id: "x", name: "x", email: "x@x.com" }, process.env.JWT_SECRET!, {
            expiresIn: -10 * 60 * 1000, // expired 10 minutes ago
        });

        const res = await request(app)
            .get("/api/auth/me")
            .set("Cookie", `accessToken=${expiredToken}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/expired/i);
    });
});

describe("POST /api/auth/refresh", () => {
    it("rotates both tokens and issues a new access token", async () => {
        const agent = request.agent(app);
        await agent.post("/api/auth/signup").send(validUser);

        const res = await agent.post("/api/auth/refresh");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/refreshed/i);

        const setCookies = (res.headers["set-cookie"] ?? []) as unknown as string[];
        expect(setCookies.find((c) => c.startsWith("accessToken="))).toBeDefined();
        expect(setCookies.find((c) => c.startsWith("refreshToken="))).toBeDefined();

        // Now the refreshed agent can hit a protected route
        const me = await agent.get("/api/auth/me");
        expect(me.status).toBe(200);
    });

    it("returns 401 when no refresh token is present", async () => {
        const res = await request(app).post("/api/auth/refresh");
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("No refresh token");
    });

    it("returns 401 for an invalid refresh token", async () => {
        const res = await request(app)
            .post("/api/auth/refresh")
            .set("Cookie", "refreshToken=garbage.token.value");

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Invalid refresh token");
    });
});
