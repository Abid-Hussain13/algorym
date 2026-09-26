import type { ReportsRange } from "@algorym/shared-types";

export interface Period {
    startSql: string;
    endSql: string;
    bucketSql: string;
}

const ROLLING_DAYS: Record<"7d" | "30d" | "90d", number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
};

export const getPeriod = (range: ReportsRange): Period => {
    switch (range) {
        case "month":
            return {
                startSql: `date_trunc('month', CURRENT_DATE)`,
                endSql: `date_trunc('month', CURRENT_DATE) + interval '1 month'`,
                bucketSql: `DATE(created_at)`,
            };
        case "year":
            return {
                startSql: `date_trunc('year', CURRENT_DATE)`,
                endSql: `date_trunc('year', CURRENT_DATE) + interval '1 year'`,
                bucketSql: `DATE_TRUNC('month', created_at)::date`,
            };
        default: {
            const days = ROLLING_DAYS[range];
            return {
                startSql: `NOW() - INTERVAL '${days} days'`,
                endSql: `NOW()`,
                bucketSql: range === "90d" ? `DATE_TRUNC('week', created_at)::date` : `DATE(created_at)`,
            };
        }
    }
};

export const THIS_MONTH_START = `date_trunc('month', CURRENT_DATE)`;
export const THIS_MONTH_END = `date_trunc('month', CURRENT_DATE) + interval '1 month'`;

const ELAPSED_SINCE_MONTH_START = `(NOW() - date_trunc('month', CURRENT_DATE))`;

export const LAST_MONTH_START = `date_trunc('month', CURRENT_DATE - interval '1 month')`;

export const LAST_MONTH_END = `(${LAST_MONTH_START} + ${ELAPSED_SINCE_MONTH_START})`;
