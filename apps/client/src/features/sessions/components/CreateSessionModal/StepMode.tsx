import { cn } from "@/lib/utils/cn";

interface StepModeProps {
    mode: "interview" | "practice";
    onModeChange: (mode: "interview" | "practice") => void;
}

export function StepMode({ mode, onModeChange }: StepModeProps) {
    return (
        <div className="flex flex-col gap-3">
            <button
                type="button"
                onClick={() => onModeChange("interview")}
                className={cn(
                    "flex items-start gap-4 rounded-lg border p-4 text-left transition-all",
                    mode === "interview"
                        ? "border-accent bg-accent-soft ring-1 ring-accent"
                        : "border-border hover:border-border-strong hover:bg-surface"
                )}
            >
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-accent">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fg">Interview</p>
                    <p className="mt-0.5 text-xs text-muted leading-relaxed">
                        Evaluate a candidate with a coding challenge. You can invite participants and track their performance.
                    </p>
                </div>
                {mode === "interview" && (
                    <div className="mt-0.5 size-4 shrink-0 rounded-full border-2 border-accent flex items-center justify-center">
                        <div className="size-2 rounded-full bg-accent" />
                    </div>
                )}
            </button>

            <button
                type="button"
                onClick={() => onModeChange("practice")}
                className={cn(
                    "flex items-start gap-4 rounded-lg border p-4 text-left transition-all",
                    mode === "practice"
                        ? "border-accent bg-accent-soft ring-1 ring-accent"
                        : "border-border hover:border-border-strong hover:bg-surface"
                )}
            >
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-info/10">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-info">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fg">Practice</p>
                    <p className="mt-0.5 text-xs text-muted leading-relaxed">
                        Solve coding problems on your own. Sharpen your skills with timed sessions.
                    </p>
                </div>
                {mode === "practice" && (
                    <div className="mt-0.5 size-4 shrink-0 rounded-full border-2 border-accent flex items-center justify-center">
                        <div className="size-2 rounded-full bg-accent" />
                    </div>
                )}
            </button>
        </div>
    );
}
