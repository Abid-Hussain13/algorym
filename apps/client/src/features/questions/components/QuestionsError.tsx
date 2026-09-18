import { Button } from "@/components/ui/Button";

interface QuestionsErrorProps {
    message: string;
    onRetry: () => void;
}

export function QuestionsError({ message, onRetry }: QuestionsErrorProps) {
    return (
        <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 p-6">
            <div className="grid size-12 place-items-center rounded-full bg-danger/10">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-6 text-danger"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>
            <p className="text-sm font-medium text-fg">Something went wrong</p>
            <p className="text-xs text-muted">{message}</p>
            <Button variant="primary" size="sm" onClick={onRetry}>
                Try Again
            </Button>
        </div>
    );
}
