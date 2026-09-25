export function SessionDetailSkeleton() {
    return (
        <div className="flex animate-pulse flex-col gap-6 p-6">
            <div className="h-4 w-24 rounded bg-surface-2" />

            <div className="flex flex-col gap-2.5">
                <div className="h-7 w-72 max-w-full rounded bg-surface-2" />
                <div className="h-4 w-56 rounded bg-surface-2" />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <div className="h-[420px] rounded-xl bg-surface-2" />
                <div className="h-[420px] rounded-xl bg-surface-2" />
            </div>

            <div className="h-56 rounded-xl bg-surface-2" />
        </div>
    );
}
