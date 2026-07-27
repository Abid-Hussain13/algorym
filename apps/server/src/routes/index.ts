import { Router } from "express";
import authRoute from "./auth.routes.js";
import questionRoute from "./questions.routes.js";

const router = Router();

router.use("/auth", authRoute);
router.use("/question", questionRoute);

export default router;
