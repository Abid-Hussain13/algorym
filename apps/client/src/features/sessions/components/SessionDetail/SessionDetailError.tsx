import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";

interface SessionDetailErrorProps {
    error: unknown;
    onRetry?: () => void;
}

export function SessionDetailError({ error, onRetry }: SessionDetailErrorProps) {
    const navigate = useNavigate();
    const isNotFound = error instanceof ApiError && error.status === 404;
    const message = error instanceof Error ? error.message : "Something went wrong";

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-danger/10">
                {isNotFound ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.7}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-7 text-danger"
                        aria-hidden="true"
                    >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="m9.5 12.5 5 5" />
                        <path d="m14.5 12.5-5 5" />
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.7}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-7 text-danger"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <p className="font-display text-lg font-semibold text-fg">
                    {isNotFound ? "Session not found" : "Couldn't load this session"}
                </p>
                <p className="max-w-sm text-sm text-muted">
                    {isNotFound
                        ? "It may have been deleted, or you don't have access to it."
                        : message}
                </p>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="default" size="sm" onClick={() => navigate("/app/sessions")}>
                    Back to Sessions
                </Button>
                {!isNotFound && onRetry ? (
                    <Button variant="primary" size="sm" onClick={onRetry}>
                        Try Again
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
