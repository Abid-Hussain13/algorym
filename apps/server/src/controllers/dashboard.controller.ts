import { Request, Response } from 'express';
import * as dashboardService from "../services/dashboard.service.js";
import { dashboardStatsType } from '@algorym/shared-types';

export const dashboardStats = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const data: dashboardStatsType = await dashboardService.getDashboardStats(userId);
    res.json({ success: true, data, message: "Dashboard data fetched successfully" });
}
