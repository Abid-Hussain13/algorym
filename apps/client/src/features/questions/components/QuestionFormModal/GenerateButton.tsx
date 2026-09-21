import { cn } from "@/lib/utils/cn";

interface GenerateButtonProps {
    canGenerate: boolean;
    isGenerating: boolean;
    onClick: () => void;
}

export function GenerateButton({ canGenerate, isGenerating, onClick }: GenerateButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!canGenerate || isGenerating}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-sm border px-[15px] py-[7px] text-[13px] font-semibold tracking-[0.02em] transition-all duration-1 shrink-0 cursor-pointer",
                canGenerate && !isGenerating
                    ? "bg-accent border-accent text-on-accent shadow-sm hover:bg-accent-hover hover:border-accent-hover active:bg-accent-active active:translate-y-px"
                    : "bg-accent/50 border-accent/50 text-on-accent/70 cursor-not-allowed"
            )}
        >
            {isGenerating ? (
                <svg className="size-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                    <path d="M20 3v4" />
                    <path d="M22 5h-4" />
                </svg>
            )}
            Generate
        </button>
    );
}
