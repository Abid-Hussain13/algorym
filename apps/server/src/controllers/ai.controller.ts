import { Request, Response } from "express";
import * as aiService from "../services/ai.service.js";

export const generateQuestion = async (req: Request, res: Response) => {
    const { title, languages } = req.body;
    const result = await aiService.generateQuestionDetails({ title, languages });
    res.json({
        success: true,
        data: result,
        message: "Question generated",
    });
};
