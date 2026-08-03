import type { RunResultPayload, RunStatus } from "@algorym/shared-types";
import AppError from "../utils/AppError.js";

export type RunLanguage = "javascript" | "python" | "java" | "cpp" | "go";

export interface RunInput {
    code: string;
    language: RunLanguage;
    stdin?: string;
}

const LANGUAGES: Record<RunLanguage, string> = {
    javascript: "javascript",
    python: "python3",
    java: "java",
    cpp: "cpp",
    go: "go",
};

interface SandboxApiResult {
    status: string;
    stdout?: string;
    stderr?: string;
    exit_code: number;
    execution_time_ms?: number;
    memory_used_kb?: number;
}

const BASE_URL = process.env.CODE_RUN_URL ?? "https://sandboxapi.p.rapidapi.com";
const API_HOST = process.env.CODE_RUN_API_HOST ?? "sandboxapi.p.rapidapi.com";
const API_KEY = process.env.CODE_RUN_API_KEY ?? "";

const toSeconds = (ms?: number): number | null => (typeof ms === "number" && Number.isFinite(ms) ? ms / 1000 : null);

export const getRuntimes = async (): Promise<Array<{ language: string; version: string }>> => {
    try {
        const response = await fetch(`${BASE_URL}/languages`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as Array<{ language: string; version: string }>;
    } catch (err) {
        console.log("Code run languages fetch failed.", err);
        return [];
    }
};

export const mapRunResult = (data: SandboxApiResult, language: string): RunResultPayload => {
    let status: RunStatus;

    if (data.status === "timeout") {
        status = "time_limit_exceeded";
    } else if (data.status === "error") {
        status = data.exit_code === 0 ? "internal_error" : "runtime_error";
    } else if (data.exit_code === 0) {
        status = "accepted";
    } else {
        status = "runtime_error";
    }

    return {
        language,
        stdout: data.stdout ?? "",
        stderr: data.stderr ?? "",
        compile_output: "",
        time: toSeconds(data.execution_time_ms),
        memory: data.memory_used_kb ?? null,
        status,
        exit_code: data.exit_code,
    };
};

export const runCode = async (input: RunInput): Promise<RunResultPayload> => {
    if (!API_KEY) throw new AppError("Code execution service is not configured", 500);

    const languageId = LANGUAGES[input.language];
    if (!languageId) throw new AppError("Unsupported language", 400);

    let response: Response;

    try {
        response = await fetch(`${BASE_URL}/v1/execute`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-RapidAPI-Key": API_KEY,
                "X-RapidAPI-Host": API_HOST,
            },
            body: JSON.stringify({
                language: languageId,
                code: input.code,
                stdin: input.stdin ?? "",
            }),
        });
    } catch {
        throw new AppError("Code execution service is unreachable", 502);
    }

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new AppError("Invalid code execution API key", 401);
        }
        if (response.status === 429) {
            throw new AppError("Code execution quota exceeded", 429);
        }
        if (response.status === 408 || response.status === 503) {
            throw new AppError("Code execution service is busy, please retry", 503);
        }
        throw new AppError("Code execution service error", response.status);
    }

    const data = (await response.json()) as SandboxApiResult;

    return mapRunResult(data, input.language);
};
