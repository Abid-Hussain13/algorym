import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const createQuestionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  languages: z.array(z.string()).min(1, "At least one language is required"),
  difficulty: z.enum(["easy", "medium", "hard"], {
    errorMap: () => ({ message: "Difficulty must be easy, medium, or hard" }),
  }),
  starter_code: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
