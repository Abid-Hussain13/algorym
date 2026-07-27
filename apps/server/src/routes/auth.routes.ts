import express from "express";
import { signup, refresh, login, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/protect.js";
const authRoute = express.Router();

authRoute.post("/signup", signup);
authRoute.post("/refresh", refresh);
authRoute.post("/login", login);
authRoute.get('/me', protect, getMe);

export default authRoute;
