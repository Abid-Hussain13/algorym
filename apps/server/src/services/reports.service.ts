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

function csvEscape(value: string | null | undefined): string {
    if (!value) return "";
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
}

export const exportSessionsCsv = async (userId: string, range: ReportsRange): Promise<string> => {
    const interval = RANGE_INTERVALS[range];
    const startSql = `NOW() - INTERVAL '${interval}'`;
    const endSql = `NOW()`;

    const { rows } = await db.query(
        `SELECT
            s.role_context, s.mode, s.language, s.status,
            s.scheduled_at, s.duration_minutes, s.started_at, s.ended_at,
            sp.display_name AS candidate_name,
            sp.email AS candidate_email,
            se.rating
        FROM sessions s
        LEFT JOIN session_participants sp ON sp.session_id = s.id AND sp.role = 'guest'
        LEFT JOIN session_evaluations se ON se.evaluated_participant_id = sp.id
            AND s.id = se.session_id
        WHERE s.created_by = $1
          AND s.created_at >= ${startSql}
          AND s.created_at < ${endSql}
        ORDER BY s.created_at DESC`,
        [userId]
    );

    const header = "Session,Mode,Language,Status,Candidate Name,Candidate Email,Rating,Scheduled At,Duration (min),Started At,Ended At";
    const lines = rows.map((r: any) => [
        csvEscape(r.role_context),
        r.mode,
        csvEscape(r.language),
        r.status,
        csvEscape(r.candidate_name),
        csvEscape(r.candidate_email),
        r.rating ?? "",
        formatDate(r.scheduled_at),
        r.duration_minutes ?? "",
        formatDateTime(r.started_at),
        formatDateTime(r.ended_at),
    ].join(","));

    return [header, ...lines].join("\n");
};
