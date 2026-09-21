import express from "express";
import { protect } from "../middlewares/protect.js";
import { validate, validateQuery } from "../middlewares/validate.js";
import { createQuestionSchema, getAllQuestionsSchema, updateQuestionSchema, generateQuestionSchema } from "../utils/validation.js";
import {
    createQuestion,
    getAllQuestions,
    getQuestion,
    updateQuestion,
    deleteQuestion,
} from "../controllers/questions.controller.js";
import { generateQuestion } from "../controllers/ai.controller.js";

const questionRoute = express.Router();

questionRoute.get("/", protect, validateQuery(getAllQuestionsSchema), getAllQuestions);
questionRoute.get("/:id", protect, getQuestion);
questionRoute.post("/", protect, validate(createQuestionSchema), createQuestion);
questionRoute.post("/generate", protect, validate(generateQuestionSchema), generateQuestion);
questionRoute.put("/:id", protect, validate(updateQuestionSchema), updateQuestion);
questionRoute.delete("/:id", protect, deleteQuestion);

export default questionRoute;
