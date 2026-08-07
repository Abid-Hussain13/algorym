import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as service from "../services/session.service.js";
import { getQuestionById } from "../services/questions.service.js";
import { getHostParticipant, getCandidateParticipant } from "../services/participant.service.js";
import { saveSessionNotes, getSessionEvaluation } from "../services/evaluation.service.js";
import * as sessionEventService from "../services/session-events.service.js";
import AppError from "../utils/AppError.js";
import type { AuthPayload } from "../types/index.js";

export const createSession = async (req: Request, res: Response) => {
    const data = req.body;
    const userId = req.user!.id;
    const session = await service.createSession(userId, data);

    res.status(201).json({ success: true, session });
};

export const getAllSessions = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const params = (req as any).validatedQuery;
    const result = await service.getAllSessions(userId, params);

    res.json({ success: true, ...result });
};

export const getSessionById = async (req: Request, res: Response) => {
    const session = await service.getSessionById(req.user!.id, req.params.id as string);

    res.json({ success: true, session });
};

export const updateSession = async (req: Request, res: Response) => {
    const session = await service.updateSession(req.user!.id, req.params.id as string, req.body);

    res.json({ success: true, session });
};

export const deleteSession = async (req: Request, res: Response) => {
    await service.deleteSession(req.user!.id, req.params.id as string);

    res.status(204).send();
};

export const startSession = async (req: Request, res: Response) => {
    const session = await service.startSession(req.user!.id, req.params.id as string);

    const host = await getHostParticipant(session.id, req.user!.id);
    await sessionEventService.logSessionEvent(session.id, host.id, "session_started", { session });

    res.json({ success: true, session });
};

export const completeSession = async (req: Request, res: Response) => {
    const session = await service.completeSession(req.user!.id, req.params.id as string);

    const host = await getHostParticipant(session.id, req.user!.id);
    await sessionEventService.logSessionEvent(session.id, host.id, "session_completed", { session });

    res.json({ success: true, session });
};

export const cancelSession = async (req: Request, res: Response) => {
    const session = await service.cancelSession(req.user!.id, req.params.id as string);

    const host = await getHostParticipant(session.id, req.user!.id);
    await sessionEventService.logSessionEvent(session.id, host.id, "session_cancelled", { session });

    res.json({ success: true, session });
};

export const joinSession = async (req: Request, res: Response) => {
    const data = req.body;

    let userId: string | undefined;

    try {
        const token = req.cookies?.accessToken;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
            userId = decoded.id;
            data.email = decoded.email;
        }
    } catch {
        // token invalid or expired — treat as guest
    }

    const result = await service.joinSession(data, userId);

    res.json({ success: true, ...result });
};

export const changeQuestion = async (req: Request, res: Response) => {
    const session = await service.changeQuestion(req.user!.id, req.params.id as string, req.body.question_id);

    const question = await getQuestionById(req.body.question_id, req.user!.id);

    const host = await getHostParticipant(session.id, req.user!.id);
    await sessionEventService.logSessionEvent(session.id, host.id, "question_change", {
        question_id: question.id,
        title: question.title,
        description: question.description,
        starter_code: question.starter_code ?? "",
        languages: question.languages,
    });

    res.json({ success: true, session });
};

export const saveNotes = async (req: Request, res: Response) => {
    const sessionId = req.params.id as string;
    const notes = req.body.notes;

    const session = await service.getSessionById(req.user!.id, sessionId);
    if (session.status !== "live" && session.status !== "completed") {
        throw new AppError("Notes can only be saved for live or completed sessions", 409);
    }

    const host = await getHostParticipant(sessionId, req.user!.id);
    const candidate = await getCandidateParticipant(sessionId);

    const evaluation = await saveSessionNotes(sessionId, host.id, candidate.id, notes ?? null);

    res.json({ success: true, evaluation });
};

export const getEvaluation = async (req: Request, res: Response) => {
    const sessionId = req.params.id as string;

    await service.getSessionById(req.user!.id, sessionId);
    await getHostParticipant(sessionId, req.user!.id);

    const evaluation = await getSessionEvaluation(sessionId);

    res.json({ success: true, evaluation });
};

export const getSessionEvents = async (req: Request, res: Response) => {
    const sessionId = req.params.id as string;

    await service.getSessionById(req.user!.id, sessionId);
    const events = await sessionEventService.getSessionEvents(sessionId);
    const sessionEvents = events.map((r) => ({
        id: r.id,
        event_type: r.event_type,
        payload: r.payload,
        created_at: r.created_at,
        actor: r.actor_id ? { id: r.actor_id, display_name: r.display_name, role: r.role } : null,
    }));

    res.json({ success: true, sessionEvents });
}
