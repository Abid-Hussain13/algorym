export function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted shrink-0">{label}</span>
            {children}
        </div>
    )
}
