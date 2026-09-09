import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/Button";
import { SessionsTable } from "@/components/dashboard/sessions-table";
import { MonthlyEvaluation } from "@/components/dashboard/evaluation-card";

const statCards = [
    {
        label: "Total Sessions",
        value: "24",
        icon: "M4 17l6-6-6-6M12 19h8",
        trend: "+12%",
        trendDirection: "up" as const,
    },
    {
        label: "This Month",
        value: "8",
        icon: "M18 20V10M12 20V4M6 20v-6",
        trend: "+20%",
        trendDirection: "up" as const,
    },
    {
        label: "Completion Rate",
        value: "87%",
        icon: "M20 6 9 17l-5-5",
        trend: "+3.2%",
        trendDirection: "up" as const,
    },
];

const monthlyEvaluation = {
    month: "September 2026",
    totalCandidates: 18,
    buckets: [
        { label: "Strong", count: 7, color: "success", barColor: "bg-success" },
        { label: "Average", count: 8, color: "accent", barColor: "bg-accent" },
        { label: "Weak", count: 3, color: "danger", barColor: "bg-danger" },
    ],
};

export function DashboardPage() {
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
                    <SessionsTable />
                </div>
                <div className="lg:col-span-1">
                    <MonthlyEvaluation {...monthlyEvaluation} />
                </div>
            </div>
        </div>
    );
}
