import { Router } from "express";
import authRoute from "./auth.routes.js";
import questionRoute from "./questions.routes.js";
import sessionRoute from "./session.routes.js";
import runRoute from "./run.routes.js";

const router = Router();

router.use("/auth", authRoute);
router.use("/question", questionRoute);
router.use("/session", sessionRoute);
router.use("/run", runRoute);

export default router;
