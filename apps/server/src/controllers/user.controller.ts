import { Request, Response } from "express";
import * as userService from "../services/user.service.js";

export const changePassword = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { current_password, new_password } = req.body;

    await userService.changePassword(userId, current_password, new_password);
    res.json({ success: true, data: null, message: "Password changed successfully" });
};

export const getPreferences = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const data = await userService.getPreferences(userId);
    res.json({ success: true, data, message: "Preferences fetched successfully" });
};

export const updatePreferences = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const data = await userService.upsertPreferences(userId, req.body);
    res.json({ success: true, data, message: "Preferences updated successfully" });
};

export const deleteAccount = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    await userService.deleteAccount(userId);

    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

    res.json({ success: true, data: null, message: "Account deleted successfully" });
};
