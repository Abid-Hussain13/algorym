import { Request, Response, NextFunction } from "express";
import type { EventType } from "@algorym/shared-types";
import * as service from "../services/session.service.js";
import { getQuestionById } from "../services/questions.service.js";
import { getHostParticipant, getCandidateParticipant } from "../services/participant.service.js";
import { saveSessionNotes, getSessionEvaluation } from "../services/evaluation.service.js";
import * as sessionEventService from "../services/session-events.service.js";
import AppError from "../utils/AppError.js";
import { verifyParticipant } from "../utils/verifyParticipant.js";
import { resolveAccessTokenUserId } from "../utils/verifyAccessToken.js";
import { broadcast } from "../ws/connectionManager.js";

export const createSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const userId = req.user!.id;
        const session = await service.createSession(userId, data);
        res.status(201).json({ success: true, data: { session }, message: "Session created" });
    } catch (err) {
        next(err);
    }
};

export const getAllSessions = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const params = (req as any).validatedQuery;
    const result = await service.getSessionsList(userId, params);

    res.json({
        success: true,
        data: {
            sessions: result.sessions,
            pagination: result.pagination,
        },
        message: "",
    });
};

export const getSessionById = async (req: Request, res: Response) => {
    const session = await service.getSessionDetail(req.user!.id, req.params.id as string);

    res.json({ success: true, data: { session }, message: "" });
};

/** `GET /api/session/:id/room?participantId=…` . */
export const getSessionRoom = async (req: Request, res: Response) => {
    const sessionId = req.params.id as string;
    const participantId = typeof req.query.participantId === "string" ? req.query.participantId : "";

    if (!participantId) throw new AppError("participantId is required", 400);

    let userId: string | undefined;
    userId = await resolveAccessTokenUserId(req.cookies?.accessToken);

    const isVerified = await verifyParticipant({ sessionId, participantId, userId });
    if (!isVerified) throw new AppError("You are not a participant of this session", 403);

    const room = await service.getSessionRoom(sessionId);

    res.json({ success: true, data: room, message: "" });
};

export const updateSession = async (req: Request, res: Response) => {
    const session = await service.updateSession(req.user!.id, req.params.id as string, req.body);

    res.json({ success: true, data: { session }, message: "Session updated" });
};

export const deleteSession = async (req: Request, res: Response) => {
    await service.deleteSession(req.user!.id, req.params.id as string);

    res.status(204).send();
};

export const startSession = async (req: Request, res: Response) => {
    const session = await service.startSession(req.user!.id, req.params.id as string);

    const host = await getHostParticipant(session.id, req.user!.id);
    await sessionEventService.logSessionEvent(session.id, host.id, "session_started", { session });

    // Tell the room immediately instead of making candidates wait for the poll.
    broadcast(session.id, { type: "session_started", payload: { session } });

    res.json({ success: true, data: { session }, message: "Session started" });
};

export const completeSession = async (req: Request, res: Response) => {
    const session = await service.completeSession(req.user!.id, req.params.id as string);

    const host = await getHostParticipant(session.id, req.user!.id);
    await sessionEventService.logSessionEvent(session.id, host.id, "session_completed", { session });

    // Tell the room. Without this the candidate sits in a finished session with
    // no idea, because nothing else they can observe changes.
    broadcast(session.id, { type: "session_completed", payload: { session } });

    res.json({ success: true, data: { session }, message: "Session completed" });
};

export const cancelSession = async (req: Request, res: Response) => {
    const session = await service.cancelSession(req.user!.id, req.params.id as string);

    const host = await getHostParticipant(session.id, req.user!.id);
    await sessionEventService.logSessionEvent(session.id, host.id, "session_cancelled", { session });

    broadcast(session.id, { type: "session_cancelled", payload: { session } });

    res.json({ success: true, data: { session }, message: "Session cancelled" });
};

export const joinSession = async (req: Request, res: Response) => {
    const data = req.body;

    const userId = await resolveAccessTokenUserId(req.cookies?.accessToken);

    const result = await service.joinSession(data, userId);

    res.json({ success: true, data: { session: result.session, participant: result.participant }, message: "Joined session" });
};

export const changeQuestion = async (req: Request, res: Response) => {
    const { question_id, language } = req.body;
    const session = await service.changeQuestion(req.user!.id, req.params.id as string, question_id, language);

    const question = await getQuestionById(question_id, req.user!.id);

    const host = await getHostParticipant(session.id, req.user!.id);
    const payload = {
        question_id: question.id,
        title: question.title,
        description: question.description,
        starter_code: question.starter_code ?? {},
        languages: question.languages,
        language,
    };

    await sessionEventService.logSessionEvent(session.id, host.id, "question_change", payload);

    // Tell the room. Without this the candidate's highlighted question lags up
    // to the 30s poll, which reads as a bug now that they can see the list.
    broadcast(session.id, { type: "question_change", payload });

    res.json({ success: true, data: { session }, message: "Question changed" });
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

    res.json({ success: true, data: { evaluation }, message: "Notes saved" });
};

export const getEvaluation = async (req: Request, res: Response) => {
    const sessionId = req.params.id as string;

    await service.getSessionById(req.user!.id, sessionId);
    await getHostParticipant(sessionId, req.user!.id);

    const evaluation = await getSessionEvaluation(sessionId);

    res.json({ success: true, data: { evaluation }, message: "" });
};

export const getSessionEvents = async (req: Request, res: Response) => {
    const sessionId = req.params.id as string;
    const { participantId, type } = (req as any).validatedQuery as {
        participantId?: string;
        type?: EventType;
    };

    // Same capability model as `GET /:id/room`: a room member proves membership
    // with their participant id (anonymous candidates included); the plain
    // cookie path (replay tooling, host scripts) still requires ownership.
    if (participantId) {
        const userId = await resolveAccessTokenUserId(req.cookies?.accessToken);
        const isVerified = await verifyParticipant({ sessionId, participantId, userId });
        if (!isVerified) throw new AppError("You are not a participant of this session", 403);
    } else {
        const userId = await resolveAccessTokenUserId(req.cookies?.accessToken);
        if (!userId) throw new AppError("Not authenticated", 401);
        await service.getSessionById(userId, sessionId);
    }

    const events = await sessionEventService.getSessionEvents(sessionId, type);
    const sessionEvents = events.map((r) => ({
        id: r.id,
        event_type: r.event_type,
        payload: r.payload,
        created_at: r.created_at,
        actor: r.actor_id ? { id: r.actor_id, display_name: r.display_name, role: r.role } : null,
    }));

    res.json({ success: true, data: { sessionEvents }, message: "" });
}

export const scheduledSessions = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const sessions = await service.scheduledSessions(userId);
    res.json({ success: true, data: { sessions }, message: "" });
}
