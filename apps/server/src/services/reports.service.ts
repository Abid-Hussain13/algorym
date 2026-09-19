import { ReportsRange, ReportsResponse, EvaluationRating, EvaluationDistributionItem, LanguageDistributionItem, SessionsOverTimePoint } from "@algorym/shared-types";
import db from "../db/pool.js";
import { getCompletedSessionsInRange, getDurationInRange, getSessionsInRange } from "./dashboard.service.js";

const RANGE_INTERVALS: Record<ReportsRange, string> = {
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
};

const getLanguageDistribution = async (userId: string, startSql: string, endSql: string): Promise<LanguageDistributionItem[]> => {
    const queryString = `
        SELECT 
            language,
            COUNT(*)::int AS count,
            ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER(), 2) AS percentage
        FROM sessions
        WHERE created_by = $1
          AND created_at >= ${startSql}
          AND created_at < ${endSql}
          AND language IS NOT NULL
        GROUP BY language
        ORDER BY count DESC
    `;
    const { rows } = await db.query(queryString, [userId]);
    return rows;
};

const getEvaluationDistribution = async (userId: string, startSql: string, endSql: string): Promise<EvaluationDistributionItem[]> => {
    const queryString = `
        SELECT 
            ev.rating,
            COUNT(*)::int AS count,
            ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER(), 2) AS percentage
        FROM session_evaluations ev
        JOIN session_participants sp ON sp.id = ev.evaluated_participant_id
        JOIN sessions s ON s.id = ev.session_id
        WHERE s.created_by = $1
          AND sp.role = 'guest'
          AND ev.rating IS NOT NULL
          AND s.created_at >= ${startSql}
          AND s.created_at < ${endSql}
        GROUP BY ev.rating
    `;
    const { rows } = await db.query(queryString, [userId]);
    return rows;
};

const getSessionsOverTime = async (userId: string, startSql: string, endSql: string, range: ReportsRange): Promise<SessionsOverTimePoint[]> => {
    const dateExpr = range === "90d"
        ? `DATE_TRUNC('week', created_at)::date`
        : `DATE(created_at)`;

    const queryString = `
        SELECT 
            ${dateExpr} AS date,
            COUNT(*)::int AS count
        FROM sessions
        WHERE created_by = $1
          AND created_at >= ${startSql}
          AND created_at < ${endSql}
        GROUP BY ${dateExpr}
        ORDER BY date
    `;
    const { rows } = await db.query(queryString, [userId]);
    return rows;
};

export const getReports = async (userId: string, range: ReportsRange): Promise<ReportsResponse> => {
    const interval = RANGE_INTERVALS[range];
    const startSql = `NOW() - INTERVAL '${interval}'`;
    const endSql = `NOW()`;

    const [totalSessions, avgDurationMinutes, completedSessions, languageDistribution, evaluationDistribution, sessionsOverTime] =
        await Promise.all([
            getSessionsInRange(userId, startSql, endSql),
            getDurationInRange(userId, startSql, endSql),
            getCompletedSessionsInRange(userId, startSql, endSql),
            getLanguageDistribution(userId, startSql, endSql),
            getEvaluationDistribution(userId, startSql, endSql),
            getSessionsOverTime(userId, startSql, endSql, range),
        ]);

    const completionRate = totalSessions > 0
        ? Math.round((completedSessions / totalSessions) * 100)
        : 0;

    return {
        stats: {
            totalSessions,
            avgDurationMinutes,
            completionRate,
        },
        sessionsOverTime,
        languageDistribution,
        evaluationDistribution,
    };
};
