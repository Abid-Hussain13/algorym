import { Router } from "express";
import { runCode } from "../controllers/run.controller.js";
import { validate } from "../middlewares/validate.js";
import { runCodeSchema } from "../utils/validation.js";

const runRoute = Router();

runRoute.post("/", validate(runCodeSchema), runCode);

export default runRoute;
