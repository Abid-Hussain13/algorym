import express from "express";
import { protect } from "../middlewares/protect.js";
import { validate } from "../middlewares/validate.js";
import { createQuestionSchema } from "../utils/validation.js";
import { createQuestion } from "../controllers/questions.controller.js";

const questionRoute = express.Router();

questionRoute.post("/", protect, validate(createQuestionSchema), createQuestion);

export default questionRoute;
