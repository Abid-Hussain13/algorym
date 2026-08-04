import express from "express";
import { validate } from "../middlewares/validate.js";
import { evaluatedUserSchema } from "../utils/validation.js";
import { protect } from "../middlewares/protect.js";
import { evaluateUser } from "../controllers/evaluation.controller.js";

const evaluationRoute = express.Router();

evaluationRoute.post("/", protect, validate(evaluatedUserSchema), evaluateUser);

export default evaluationRoute;
