import { Request, Response } from "express";
import * as questionService from "../services/questions.service.js";

export const createQuestion = async (req: Request, res: Response) => {
    const { title, description, languages, difficulty, starter_code } = req.body;
    const question = await questionService.createQuestion({
        owner_id: req.user!.id,
        title,
        description,
        languages,
        difficulty,
        starter_code,
    });
    res.status(201).json({ success: true, data: { question }, message: "Question created" });
};

export const getAllQuestions = async (req: Request, res: Response) => {
    const questions = await questionService.getAllQuestions(req.user!.id);
    res.json({ success: true, data: { questions }, message: "" });
};

export const getQuestion = async (req: Request, res: Response) => {
    const question = await questionService.getQuestionById(req.params.id as string, req.user!.id);
    res.json({ success: true, data: { question }, message: "" });
};

export const updateQuestion = async (req: Request, res: Response) => {
    const { title, description, languages, difficulty, starter_code } = req.body;
    const question = await questionService.updateQuestion(req.params.id as string, req.user!.id, {
        owner_id: req.user!.id,
        title,
        description,
        languages,
        difficulty,
        starter_code,
    });
    res.json({ success: true, data: { question }, message: "Question updated" });
};

export const deleteQuestion = async (req: Request, res: Response) => {
    await questionService.deleteQuestion(req.params.id as string, req.user!.id);
    res.status(204).end();
};
