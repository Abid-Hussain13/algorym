import express, { Request, Response, NextFunction } from "express";
import { signup } from "../controllers/auth.controller.js";
const auth_route = express.Router();

auth_route.post("/signup", signup);
