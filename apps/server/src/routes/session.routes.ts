import { Router } from "express";
import { createSession, getAllSessions, getSessionById, updateSession, deleteSession } from "../controllers/session.controller.js";
import { protect } from "../middlewares/protect.js";
import { validate, validateQuery } from "../middlewares/validate.js";
import { createSessionSchema, getAllSessionsSchema, updateSessionSchema } from "../utils/validation.js";

const sessionRoute = Router();

sessionRoute.post("/", protect, validate(createSessionSchema), createSession);
sessionRoute.get("/", protect, validateQuery(getAllSessionsSchema), getAllSessions);
sessionRoute.get("/:id", protect, getSessionById);
sessionRoute.patch("/:id", protect, validate(updateSessionSchema), updateSession);
sessionRoute.delete("/:id", protect, deleteSession);

export default sessionRoute;
