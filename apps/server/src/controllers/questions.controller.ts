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
  res.status(201).json({ question });
};

export const getAllQuestions = async (req: Request, res: Response) => {
  const questions = await questionService.getAllQuestions(req.user!.id);
  res.json({ questions, count: questions.length });
};

export const getQuestion = async (req: Request, res: Response) => {
  const question = await questionService.getQuestionById(req.params.id, req.user!.id);
  res.json({ question });
};

export const updateQuestion = async (req: Request, res: Response) => {
  const { title, description, languages, difficulty, starter_code } = req.body;
  const question = await questionService.updateQuestion(req.params.id, req.user!.id, {
    owner_id: req.user!.id,
    title,
    description,
    languages,
    difficulty,
    starter_code,
  });
  res.json({ question });
};

export const deleteQuestion = async (req: Request, res: Response) => {
  await questionService.deleteQuestion(req.params.id, req.user!.id);
  res.status(204).end();
};
