interface QuestionsEmptyProps {
    hasFilters: boolean;
}

export function QuestionsEmpty({ hasFilters }: QuestionsEmptyProps) {
    return (
        <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-2 p-6 text-center">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-8 text-muted"
            >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
                <path d="M10 9H8" />
            </svg>
            <p className="text-sm font-medium text-fg">No questions found</p>
            <p className="text-xs text-muted">
                {hasFilters
                    ? "Try adjusting your filters"
                    : "Create your first question to get started"}
            </p>
        </div>
    );
}
