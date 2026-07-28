import { Router } from "express";
import {
    createSession, getAllSessions, getSessionById,
    updateSession, deleteSession, startSession,
    completeSession, cancelSession, joinSession, changeQuestion
} from "../controllers/session.controller.js";
import { protect } from "../middlewares/protect.js";
import { validate, validateQuery } from "../middlewares/validate.js";
import {
    createSessionSchema, getAllSessionsSchema, updateSessionSchema,
    joinSessionSchema, changeQuestionSchema
} from "../utils/validation.js";

const sessionRoute = Router();

// Join — no auth, auth is optional user can be guest
sessionRoute.post("/join", validate(joinSessionSchema), joinSession);

// CRUD
sessionRoute.post("/", protect, validate(createSessionSchema), createSession);
sessionRoute.get("/", protect, validateQuery(getAllSessionsSchema), getAllSessions);
sessionRoute.get("/:id", protect, getSessionById);
sessionRoute.patch("/:id", protect, validate(updateSessionSchema), updateSession);
sessionRoute.delete("/:id", protect, deleteSession);

// Actions
sessionRoute.patch("/:id/start", protect, startSession);
sessionRoute.patch("/:id/complete", protect, completeSession);
sessionRoute.patch("/:id/cancel", protect, cancelSession);
sessionRoute.patch("/:id/question", protect, validate(changeQuestionSchema), changeQuestion);

export default sessionRoute;
