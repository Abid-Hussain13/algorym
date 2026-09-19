import { Request, Response } from "express";
import * as reportsService from "../services/reports.service.js";
import { ReportsRange } from "@algorym/shared-types";

export const getReports = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { range } = (req as any).validatedQuery as { range: ReportsRange };

    const data = await reportsService.getReports(userId, range);
    res.json({ success: true, data, message: "Reports fetched successfully" });
};
