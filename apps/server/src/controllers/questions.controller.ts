import { Request, Response } from "express";
import { createQuestion as createQuestionService } from "../services/questions.service.js";

export const createQuestion = async (req: Request, res: Response) => {
    const { title, description, languages, difficulty, starter_code } = req.body;
    const question = await createQuestionService({ owner_id: req.user!.id, title, description, languages, difficulty, starter_code });

    res.json({ question });
}
