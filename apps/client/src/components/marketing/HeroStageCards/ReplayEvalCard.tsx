const RATINGS = [
  { label: 'Weak', delay: '0s' },
  { label: 'Average', delay: '.12s' },
  { label: 'Strong', delay: '.24s', strong: true },
]

export function ReplayEvalCard() {
  return (
    <div className="il-card c3 animate-card-3 absolute bottom-0 left-1/2 z-20 w-[180px] overflow-hidden rounded-md border border-border bg-surface opacity-0 shadow-md pointer-events-none [transform:translateX(-50%)]">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <span className="grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-full bg-accent">
          <svg viewBox="0 0 12 14" className="ml-px h-[9px] w-[9px] fill-white" aria-hidden="true">
            <polygon points="0,0 12,7 0,14" />
          </svg>
        </span>
        <span className="flex flex-1 flex-col gap-[3px]">
          <span className="relative h-[3px] overflow-hidden rounded-[2px] bg-border">
            <span className="il-scrub-fill absolute bottom-0 left-0 top-0 w-0 animate-scrub rounded-[2px] bg-accent" />
          </span>
          <span className="flex justify-between">
            <span className="h-1 w-1 rounded-full bg-p-teal" />
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="h-1 w-1 rounded-full bg-p-violet" />
            <span className="h-1 w-1 rounded-full bg-border" />
          </span>
        </span>
        <span className="flex-shrink-0 font-mono text-[8px] text-muted">02:34</span>
      </div>
      <div className="px-3 py-2">
        <div className="mb-[5px] text-[8px] font-semibold uppercase tracking-[0.05em] text-muted">
          Evaluation
        </div>
        <div className="flex gap-[5px]">
          {RATINGS.map((rating) => (
            <span
              key={rating.label}
              style={{ animationDelay: rating.delay }}
              className={`il-rating flex-1 animate-rate rounded-sm border px-0 py-[5px] text-center text-[9px] font-semibold opacity-0 ${
                rating.strong
                  ? 'border-p-teal bg-p-teal/10 text-p-teal'
                  : 'border-border text-muted'
              }`}
            >
              {rating.label}
            </span>
          ))}
        </div>
        <div className="mt-1.5 flex items-center gap-[3px] text-[8px] tracking-[0.02em] text-faint">
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            className="h-[9px] w-[9px]"
            aria-hidden="true"
          >
            <rect x="2" y="5" width="8" height="6" rx="1.5" />
            <path d="M4 5V3.5a2 2 0 0 1 4 0V5" />
          </svg>
          Private · host only
        </div>
      </div>
    </div>
  )
}