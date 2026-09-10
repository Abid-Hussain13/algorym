import { Router } from "express";
import { dashboardStats } from "../controllers/dashboard.controller.js";
import { protect } from "../middlewares/protect.js";

const dashboardRoute = Router();

dashboardRoute.get('/stats', protect, dashboardStats);

export default dashboardRoute;
