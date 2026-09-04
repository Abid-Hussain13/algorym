import express from "express";
import { signup, refresh, login, getMe, logout } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/protect.js";
import { validate } from "../middlewares/validate.js";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../utils/validation.js";
import { forgotPassword, resetPasswordHandler } from "../controllers/passwordReset.controller.js";
import { verifyEmailHandler, resendVerification } from "../controllers/emailVerification.controller.js";

const authRoute = express.Router();

authRoute.post("/signup", validate(signupSchema), signup);
authRoute.post("/login", validate(loginSchema), login);
authRoute.post("/refresh", refresh);
authRoute.get("/me", protect, getMe);
authRoute.post('/logout', logout);

// Password reset
authRoute.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
authRoute.post("/reset-password", validate(resetPasswordSchema), resetPasswordHandler);

// Email verification
authRoute.get("/verify-email", verifyEmailHandler);
authRoute.post("/resend-verification", protect, resendVerification);

export default authRoute;
