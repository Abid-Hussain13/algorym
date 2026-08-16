export function LiveSessionCard() {
  return (
    <div className="il-card c1 animate-card-1 absolute left-0 top-11 z-20 w-[155px] overflow-hidden rounded-md border border-border bg-surface opacity-0 shadow-md pointer-events-none">
      <div className="flex items-center justify-between border-b border-border bg-inset px-3 py-2">
        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.04em] text-muted">
          Session
        </span>
        <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.03em] text-accent">
          <span className="il-live-dot h-[5px] w-[5px] animate-live-pulse rounded-full bg-accent" />
          Live
        </span>
      </div>
      <div className="p-3">
        <div className="mb-2 flex items-center gap-[5px] text-[11px] font-semibold text-fg">
          <span className="grid h-4 w-4 flex-shrink-0 place-items-center rounded-[4px] bg-accent-soft">
            <svg viewBox="0 0 10 10" fill="none" className="h-[9px] w-[9px]" aria-hidden="true">
              <rect x="1" y="1" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <text
                x="5"
                y="7"
                textAnchor="middle"
                fontSize="6"
                fontWeight="600"
                fill="currentColor"
              >
                Q
              </text>
            </svg>
          </span>
          Two Sum
        </div>
        <div className="mb-2 flex gap-1.5">
          <div className="flex-1 rounded-sm border border-border bg-inset p-1.5">
            <div className="text-[10px] font-semibold text-fg">You</div>
            <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.04em] text-accent">
              Host
            </div>
          </div>
          <div className="flex-1 rounded-sm border border-border bg-inset p-1.5">
            <div className="text-[10px] font-semibold text-fg">Usman</div>
            <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.04em] text-p-teal">
              Guest
            </div>
          </div>
        </div>
        <span className="inline-block rounded-full bg-p-violet/10 px-[7px] py-0.5 text-[8px] font-semibold uppercase tracking-[0.03em] text-p-violet">
          Interview
        </span>
      </div>
    </div>
  )
}