import { Request, Response } from "express";
import * as service from "../services/session.service.js";

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
}

export const updateSession = async (req: Request, res: Response) => {
    const updatedsession = await service.updateSession(req.user!.id, req.params.id as string, req.body);

    res.json({ success: true, updatedsession });
}

export const deleteSession = async (req: Request, res: Response) => {
    await service.deleteSession(req.user!.id, req.params.id as string);

    res.status(204).send();
}
