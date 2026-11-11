import { Router } from "express";
import { runCode } from "../controllers/run.controller.js";
import { validate } from "../middlewares/validate.js";
import { runCodeSchema } from "../utils/validation.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const runRoute = Router();

// Sandboxed execution hits a paid upstream; keep a per-IP ceiling on it.
const runBucket = rateLimit("run", 60, 60 * 1000);
runRoute.post("/", runBucket, validate(runCodeSchema), runCode);

export default runRoute;
