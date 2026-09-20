import { z } from "zod";

export const signupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email({ error: "Invalid email format" }),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
    email: z.email({ error: "Invalid email format" }),
    password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
    email: z.email({ error: "Invalid email format" }),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createQuestionSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    languages: z.array(z.string()).min(1, "At least one language is required"),
    difficulty: z.enum(["easy", "medium", "hard"], { message: "Difficulty must be easy, medium, or hard" }),
    starter_code: z.record(z.string(), z.string()).optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const createSessionSchema = z.object({
    question_id: z.string().optional(),
    mode: z.enum(["interview", "practice"]),
    language: z.string().optional(),
    role_context: z.string().optional(),
    scheduled_at: z.iso.datetime({ offset: true }).optional(),
    duration_minutes: z.number().min(10, "Session should be longer than 10 minutes").max(301, "Session should be under 5 hours").optional(),
    status: z.enum(["scheduled", "live", "completed", "cancelled", "expired"]).optional()
});

export const getAllSessionsSchema = z.object({
    search: z.string().optional(),
    mode: z.enum(["interview", "practice"]).optional(),
    status: z.enum(["scheduled", "live", "completed", "cancelled", "expired"]).optional(),
    sort_by: z.enum(["date_desc", "date_asc", "status", "rating"]).default("date_desc"),
    page: z.coerce.number().int().min(1).default(1),
});

export const updateSessionSchema = createSessionSchema.partial();

export const joinSessionSchema = z.object({
    access_token: z.string().min(1, "Access token is required"),
    email: z.email({ error: "Invalid email format" }).optional().or(z.literal("")),
    display_name: z.string().optional(),
    consent_to_contact: z.boolean(),
});

export const getAllQuestionsSchema = z.object({
    search: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    sort_by: z.enum(["date_desc", "date_asc", "title_desc", "title_asc"]).default("date_desc"),
    page: z.coerce.number().int().min(1).default(1)
})

export const changeQuestionSchema = z.object({
    question_id: z.uuid("Invalid question ID format"),
    language: z.string().min(1, "Language is required"),
});

export const runCodeSchema = z.object({
    sessionId: z.uuid("Invalid session ID format"),
    participantId: z.uuid("Invalid participant ID format"),
    code: z.string().min(1, "Code is required").max(20000, "Code must be under 20KB"),
    language: z.enum(["javascript", "python", "java", "cpp", "go"], {
        message: "Language must be javascript, python, java, cpp, or go",
    }),
    stdin: z.string().max(10000, "Stdin must be under 10KB").optional(),
});


export const reportsQuerySchema = z.object({
    range: z.enum(["7d", "30d", "90d"]).default("30d"),
});

export const evaluatedUserSchema = z.object({
    sessionId: z.uuid("Invalid session ID format"),
    participantId: z.uuid("Invalid participant ID format"),
    rating: z.enum(["weak", "average", "strong"]).optional(),
    notes: z.string().optional()
})

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type GetAllSessionsQuery = z.infer<typeof getAllSessionsSchema>;
export type RunCodeInput = z.infer<typeof runCodeSchema>;
export type EvaluatedUserInput = z.infer<typeof evaluatedUserSchema>;
export type getAllQuestionsQuery = z.infer<typeof getAllQuestionsSchema>;
export type ReportsQuery = z.infer<typeof reportsQuerySchema>;

export const changePasswordSchema = z.object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
});

export const updatePreferencesSchema = z.object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    default_language: z.string().nullable().optional(),
    default_duration_minutes: z.number().min(10).max(301).nullable().optional(),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
