import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as service from "../services/session.service.js";
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

    res.json({ success: true, session });
};

export const completeSession = async (req: Request, res: Response) => {
    const session = await service.completeSession(req.user!.id, req.params.id as string);

    res.json({ success: true, session });
};

export const cancelSession = async (req: Request, res: Response) => {
    const session = await service.cancelSession(req.user!.id, req.params.id as string);

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

    res.json({ success: true, session });
};
