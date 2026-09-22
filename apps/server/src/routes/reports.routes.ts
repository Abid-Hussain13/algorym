import { Router } from "express";
import { getReports, exportCsv } from "../controllers/reports.controller.js";
import { protect } from "../middlewares/protect.js";
import { validateQuery } from "../middlewares/validate.js";
import { reportsQuerySchema } from "../utils/validation.js";

const reportsRoute = Router();

reportsRoute.get("/", protect, validateQuery(reportsQuerySchema), getReports);
reportsRoute.get("/export", protect, validateQuery(reportsQuerySchema), exportCsv);

export default reportsRoute;
