import express from "express";
import { protect } from "../middlewares/protect.js";
import { validate, validateQuery } from "../middlewares/validate.js";
import { createQuestionSchema, getAllQuestionsSchema, updateQuestionSchema } from "../utils/validation.js";
import {
    createQuestion,
    getAllQuestions,
    getQuestion,
    updateQuestion,
    deleteQuestion,
} from "../controllers/questions.controller.js";

const questionRoute = express.Router();

questionRoute.get("/", protect, validateQuery(getAllQuestionsSchema), getAllQuestions);
questionRoute.get("/:id", protect, getQuestion);
questionRoute.post("/", protect, validate(createQuestionSchema), createQuestion);
questionRoute.put("/:id", protect, validate(updateQuestionSchema), updateQuestion);
questionRoute.delete("/:id", protect, deleteQuestion);

export default questionRoute;
