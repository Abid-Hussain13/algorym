export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-2 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-fg">{title}</h2>
            {children}
        </div>
    )
}
