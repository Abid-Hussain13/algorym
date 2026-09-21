import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import AppError from "../utils/AppError.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const LANGUAGE_LABELS: Record<string, string> = {
    javascript: "JavaScript",
    python: "Python",
    java: "Java",
    cpp: "C++",
    go: "Go",
};

function buildPrompt(title: string, languages: string[]): string {
    const langList = languages
        .map((l) => LANGUAGE_LABELS[l] ?? l)
        .join(", ");

    return `You are a coding interview question generator for an assessment platform.

QUESTION TITLE: "${title}"
LANGUAGES: ${langList}

Generate a complete coding question based on the title above.

Return ONLY a valid JSON object (no markdown fences, no extra text) with this exact structure:
{
  "description": "A detailed problem statement formatted in markdown with:\\n- **Problem Overview** (2-3 sentences explaining the task)\\n- **Input Format** (describe the function signature and parameters)\\n- **Output Format** (describe the return value)\\n- **Constraints** (3-4 realistic constraints like array length, value ranges)\\n- **Examples** (2-3 examples with Input, Output, and Explanation)",
  "starter_code": {
    "${languages[0]}": "language-appropriate function signature only, no solution, with a brief comment describing the task"
  }
}

Rules:
- description must be clear, concise, and suitable for a technical interview
- starter_code must contain ONLY the function signature with comments — no implementation
- Use idiomatic conventions for each language (e.g., camelCase for JS, snake_case for Python)
- starter_code keys must exactly match the language identifiers provided: ${languages.join(", ")}
- difficulty should match an ${getDifficultyHint(title)} level problem`;
}

function getDifficultyHint(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes("easy") || lower.includes("basic") || lower.includes("simple")) return "easy";
    if (lower.includes("hard") || lower.includes("complex") || lower.includes("advanced")) return "hard";
    return "medium";
}

interface GenerateQuestionParams {
    title: string;
    languages: string[];
}

export interface GenerateQuestionResult {
    description: string;
    starter_code: Record<string, string>;
}

export async function generateQuestionDetails(
    params: GenerateQuestionParams
): Promise<GenerateQuestionResult> {
    if (!process.env.GEMINI_API_KEY) {
        throw new AppError("AI service not configured", 500);
    }

    const prompt = buildPrompt(params.title, params.languages);

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: { responseMimeType: "application/json" },
    });

    const text = response.text;
    if (!text) {
        throw new AppError("AI returned empty response", 502);
    }

    let parsed: { description?: string; starter_code?: Record<string, string> };
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new AppError("AI returned invalid response", 502);
    }

    if (!parsed.description || typeof parsed.description !== "string") {
        throw new AppError("AI response missing description", 502);
    }

    const starterCode: Record<string, string> = {};
    if (parsed.starter_code && typeof parsed.starter_code === "object") {
        for (const lang of params.languages) {
            if (typeof parsed.starter_code[lang] === "string") {
                starterCode[lang] = parsed.starter_code[lang];
            }
        }
    }

    return {
        description: parsed.description,
        starter_code: starterCode,
    };
}
