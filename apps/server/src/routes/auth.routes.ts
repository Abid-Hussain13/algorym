import express from "express";
import { signup, refresh, login, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/protect.js";
import { validate } from "../middlewares/validate.js";
import { signupSchema, loginSchema } from "../utils/validation.js";

const authRoute = express.Router();

authRoute.post("/signup", validate(signupSchema), signup);
authRoute.post("/login", validate(loginSchema), login);
authRoute.post("/refresh", refresh);
authRoute.get("/me", protect, getMe);

export default authRoute;
