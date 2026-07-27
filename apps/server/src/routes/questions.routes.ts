import express from "express";
import { protect } from "../middlewares/protect.js";
import { validate } from "../middlewares/validate.js";
import { createQuestionSchema } from "../utils/validation.js";
import {
  createQuestion,
  getAllQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questions.controller.js";

const questionRoute = express.Router();

questionRoute.get("/", protect, getAllQuestions);
questionRoute.get("/:id", protect, getQuestion);
questionRoute.post("/", protect, validate(createQuestionSchema), createQuestion);
questionRoute.put("/:id", protect, validate(createQuestionSchema), updateQuestion);
questionRoute.delete("/:id", protect, deleteQuestion);

export default questionRoute;
