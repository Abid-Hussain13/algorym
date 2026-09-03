import { Request, Response } from "express";
import { getHostParticipant, getParticipantBySession } from "../services/participant.service.js";
import AppError from "../utils/AppError.js";
import * as sessionService from "../services/session.service.js";
import * as evaluationService from "../services/evaluation.service.js";

export const evaluateUser = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { sessionId, participantId, rating, notes } = req.body;

    const hostParticipant = await getHostParticipant(sessionId, userId);

    const session = await sessionService.getSessionById(userId, sessionId);
    if (participantId === hostParticipant.id)
        throw new AppError("Host cannot evaluate themselves", 400);
    if (session.status != "completed")
        throw new AppError("Complete Session before evaluating candidate", 409);
    if (session.mode != "interview")
        throw new AppError("Only interview session can evaluate user", 409);

    await getParticipantBySession(sessionId, participantId);

    const evaluateInput: evaluationService.sessionEvaluationParams = {
        session_id: sessionId,
        evaluator_participant_id: hostParticipant.id,
        evaluated_participant_id: participantId,
        rating,
        notes
    }

    const result = await evaluationService.evaluateUser(evaluateInput);
    res.status(200).json({ success: true, data: { result }, message: "Candidate evaluated" });
}
