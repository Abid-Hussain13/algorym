import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { ReportsRange } from '@algorym/shared-types'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { reportsApi } from '@/lib/api/endpoints'
import {
    useReports,
    TimeFilter,
    ReportStatCards,
    SessionsOverTime,
    LanguageMix,
    EvaluationDonut,
} from '@/features/reports'

export function Reports() {
    const [range, setRange] = useState<ReportsRange>('30d')
    const [exporting, setExporting] = useState(false)
    const { data, isLoading, error, refetch } = useReports(range)

    const handleExport = useCallback(async () => {
        setExporting(true);
        try {
            const csv = await reportsApi.exportCsv(range);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `reports-${range}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Export downloaded");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to export");
        } finally {
            setExporting(false);
        }
    }, [range]);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
                    Reports
                </h1>
                <div className="flex items-center gap-3">
                    <TimeFilter value={range} onChange={setRange} />
                    <Button variant="primary" size="sm" onClick={handleExport} loading={exporting}>
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
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export
                    </Button>
                </div>
            </div>

            {isLoading && (
                <div className="flex h-64 items-center justify-center">
                    <Spinner size="lg" />
                </div>
            )}

            {error && (
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <div className="grid size-12 place-items-center rounded-full bg-danger/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-danger">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-sm font-medium text-fg">Something went wrong</p>
                        <p className="text-xs text-muted">{error.message}</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => refetch()}>
                        Try Again
                    </Button>
                </div>
            )}

            {data && (
                <>
                    <ReportStatCards stats={data.stats} />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <LanguageMix data={data.languageDistribution} />
                        <EvaluationDonut data={data.evaluationDistribution} />
                    </div>

                    <SessionsOverTime data={data.sessionsOverTime} range={range} />
                </>
            )}
        </div>
    )
}
