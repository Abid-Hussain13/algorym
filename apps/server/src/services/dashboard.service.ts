import db from "../db/pool.js";

export interface dashboardStatsType {
    stats: {
        sessions: number,
        sessionTrend: number,
        avgDurationThisMonth: number | null,
        durationTrend: number | null,
        completionPercentage: number,
        thisMonthCompletedSessions: number
    },
    sessions: Array<{
        id: string,
        title: string,
        status: string,
        date: string,
        candidateEmail: string
    }>,
    evaluation: {
        date: string,
        totalCandiateRatings: number,
        buckets: Array<{
            label: string,
            count: number
        }>
    }
}

export interface recentSessionType {
    id: string,
    role_context: string,
    status: string,
    created_at: string,
    email: string
}
export interface monthRatingType {
    rating: string,
    count: number
}

export const getSessionsInRange = async (userId: string, startSql: string, endSql: string): Promise<number> => {
    const queryString = `SELECT COUNT(*)::int FROM sessions WHERE created_by = $1 AND created_at >= ${startSql}
                    AND created_at < ${endSql}`;
    const { rows } = await db.query(queryString, [userId]);
    return rows[0].count;
}
export const getDurationInRange = async (userId: string, startSql: string, endSql: string): Promise<number | null> => {
    const queryString = `SELECT AVG(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60)::int AS avg_duration FROM sessions
                        WHERE created_by = $1 AND status = 'completed' AND created_at >= ${startSql} AND created_at < ${endSql}`;

    const { rows } = await db.query(queryString, [userId]);
    return rows[0]?.avg_duration ?? null;
}

export const getCompletedSessionsInRange = async (userId: string, startDate: string, endDate: string): Promise<number> => {
    const queryString = `SELECT COUNT(*)::int FROM sessions WHERE created_by = $1 AND status = 'completed' AND
                        created_at >= ${startDate} AND created_at < ${endDate}`;

    const { rows } = await db.query(queryString, [userId]);
    return rows[0].count;
}

export const getRecentSessions = async (userId: string): Promise<recentSessionType[]> => {
    const queryString = `Select s.id, s.role_context, s.status, s.created_at, sp.email from sessions s Left 
                        Join session_participants sp on 
                        sp.session_id = s.id AND sp.role = 'guest' WHERE
                        s.created_by = $1 Order by s.created_at DESC LIMIT 10`;
    const { rows } = await db.query(queryString, [userId]);
    return rows;
}

const getMonthRatings = async (userId: string): Promise<monthRatingType[]> => {
    const { rows } = await db.query(
        `SELECT ev.rating, count(*)::int AS count
         FROM session_evaluations ev
         JOIN session_participants sp ON sp.id = ev.evaluated_participant_id
         JOIN sessions s ON s.id = ev.session_id
         WHERE s.created_by = $1
           AND sp.role = 'guest'
           AND ev.rating IS NOT NULL
           AND s.created_at >= date_trunc('month', CURRENT_DATE)
           AND s.created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
         GROUP BY ev.rating`,
        [userId]
    );
    return rows;
};

export const getDashboardStats = async (userId: string): Promise<dashboardStatsType> => {
    const thisMonthStart = `date_trunc('month', CURRENT_DATE)`;
    const thisMonthEnd = `date_trunc('month', CURRENT_DATE) + interval '1 month'`;
    const lastMonthStart = `date_trunc('month', CURRENT_DATE - interval '1 month')`;

    const [thisMonth, lastMonth, avgDurationThisMonth, avgDurationLastMonth, thisMonthCompletedSessions, recentSessions, monthRating] = await Promise.all([
        getSessionsInRange(userId, thisMonthStart, thisMonthEnd),
        getSessionsInRange(userId, lastMonthStart, thisMonthStart),
        getDurationInRange(userId, thisMonthStart, thisMonthEnd),
        getDurationInRange(userId, lastMonthStart, thisMonthStart),
        getCompletedSessionsInRange(userId, thisMonthStart, thisMonthEnd),
        getRecentSessions(userId),
        getMonthRatings(userId)
    ])

    const sessionTrend = thisMonth - lastMonth;
    const durationTrend = avgDurationLastMonth && avgDurationLastMonth > 0
        ? Math.round(((avgDurationThisMonth ?? 0) - avgDurationLastMonth) / avgDurationLastMonth * 100)
        : null;
    const completionPercentage = thisMonth > 0
        ? Math.round((thisMonthCompletedSessions / thisMonth) * 100)
        : 0;

    const ratingLabelMap: Record<string, string> = {
        strong: "Strong",
        weak: "Weak",
        average: "Average"
    }

    const formatRating = monthRating.map(r => ({
        label: ratingLabelMap[r.rating] ?? r.rating,
        count: r.count
    }))

    const totalCandiateRatings = formatRating.reduce((sum, r) => sum + r.count, 0);

    return {
        stats: {
            sessions: thisMonth,
            sessionTrend,
            avgDurationThisMonth,
            durationTrend,
            completionPercentage,
            thisMonthCompletedSessions
        },
        sessions: recentSessions.map((s) => ({
            id: s.id,
            title: s.role_context,
            status: s.status,
            date: new Date(s.created_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
            }),
            candidateEmail: s.email
        })),
        evaluation: {
            date: new Date().toLocaleDateString("en-US", {
                month: "long", year: "numeric"
            }),
            totalCandiateRatings,
            buckets: formatRating
        }
    }
}
