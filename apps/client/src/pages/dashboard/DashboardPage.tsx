import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/Button";
import { SessionsTable } from "@/components/dashboard/sessions-table";
import { MonthlyEvaluation } from "@/components/dashboard/evaluation-card";
import { useCallback, useEffect, useState } from "react";
import { http } from "@/lib";
import { toast } from "sonner";
import type { dashboardStatsType } from "@algorym/shared-types";
import { Spinner } from "@/components/ui/Spinner";

export function DashboardPage() {
    const [data, setData] = useState<dashboardStatsType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(() => {
        setLoading(true);
        setError(null);
        http.get<dashboardStatsType>('/api/dashboard/stats')
            .then(setData)
            .catch((err) => {
                const message = err instanceof Error ? err.message : "Failed to load dashboard";
                setError(message);
                toast.error(message);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    if (loading) return (
        <div className="flex h-full items-center justify-center">
            <Spinner size="lg" />
        </div>
    );
    if (!data) return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
            <div className="grid size-12 place-items-center rounded-full bg-danger/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-danger">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm font-medium text-fg">Something went wrong</p>
                <p className="text-xs text-muted">{error || "Failed to load dashboard data"}</p>
            </div>
            <Button variant="primary" size="sm" onClick={fetchDashboard}>
                Try Again
            </Button>
        </div>
    );

    const { stats, sessions, evaluation } = data;

    const statCards: Array<{
        label: string;
        value: string;
        icon: string;
        trend?: string;
        trendDirection?: "up" | "down";
        comparison?: string;
    }> = [
        {
            label: "Sessions",
            value: String(stats.sessions),
            icon: "M4 17l6-6-6-6M12 19h8",
            trend: stats.sessions > 0 ? (stats.sessionTrend > 0 ? `+${stats.sessionTrend}` : stats.sessionTrend === 0 ? "0" : `${stats.sessionTrend}`) : undefined,
            trendDirection: stats.sessions > 0 ? (stats.sessionTrend >= 0 ? "up" : "down") : undefined,
            comparison: "vs. last month",
        },
        {
            label: "Average Duration",
            value: stats.avgDurationThisMonth ? `${stats.avgDurationThisMonth} min` : "N/A",
            icon: "M12 2v10l4.5 4.5",
            trend: stats.durationTrend !== null ? `${stats.durationTrend > 0 ? "+" : ""}${stats.durationTrend}%` : undefined,
            trendDirection: stats.durationTrend !== null ? (stats.durationTrend >= 0 ? "up" : "down") : undefined,
            comparison: "vs. last month",
        },
        {
            label: "Completion Rate",
            value: `${stats.completionPercentage}%`,
            icon: "M20 6 9 17l-5-5",
            trend: stats.sessions > 0 ? `${stats.thisMonthCompletedSessions} out of ${stats.sessions}` : undefined,
            trendDirection: "up",
            comparison: "",
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
                    Dashboard
                </h1>
                <Button variant="primary" size="sm">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4"
                    >
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    New Session
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {statCards.map((card) => (
                    <StatCard key={card.label} {...card} />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <div className="lg:col-span-3">
                    <SessionsTable sessions={sessions} />
                </div>
                <div className="lg:col-span-1">
                    <MonthlyEvaluation {...evaluation} />
                </div>
            </div>
        </div>
    );
}
