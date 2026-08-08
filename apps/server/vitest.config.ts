import { defineConfig } from "vitest/config";
import { testEnv } from "./test/test-env.js";

const env = testEnv();

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["./test/setup.ts"],
        globalSetup: "./test/global-setup.ts",
        include: ["test/**/*.test.ts"],
        fileParallelism: false,
        env: {
            NODE_ENV: env.NODE_ENV,
            DB_USER: env.DB_USER,
            DB_PASSWORD: env.DB_PASSWORD,
            DB_HOST: env.DB_HOST,
            DB_PORT: env.DB_PORT,
            DB_DATABASE: env.DB_DATABASE,
            JWT_SECRET: env.JWT_SECRET,
            JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
            ACCESS_TOKEN_EXPIRY: env.ACCESS_TOKEN_EXPIRY,
            REFRESH_TOKEN_EXPIRY: env.REFRESH_TOKEN_EXPIRY,
        },
    },
});