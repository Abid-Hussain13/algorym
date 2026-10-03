import { useState } from "react";
import { toast } from "sonner";
import { evaluationApi } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { RATING_BADGES, RATING_LABELS } from "@/features/sessions";
import { cn } from "@/lib/utils/cn";
import type { EvaluationRating } from "@algorym/shared-types";

interface HostVerdictProps {
    sessionId: string;
    /** The guest's participantId, from the awareness roster. */
    candidateId: string | null;
    mode: string;
    status: string;
    existingRating: EvaluationRating | null;
    onCompleteSession: () => void;
    isCompleting: boolean;
}

const RATINGS: EvaluationRating[] = ["weak", "average", "strong"];

/**
 * Host-only end-of-interview verdict.
 *
 * The server enforces the real rules — evaluation requires the session to be
 * **completed** and the mode to be **interview** — so the buttons are disabled
 * with the reason shown rather than letting the request 409.
 *
 * All three ratings are offered (not just ✓/✕) because the stored schema is
 * weak / average / strong; a pass/fail pair would lose the middle.
 */
export function HostVerdict({
    sessionId,
    candidateId,
    mode,
    status,
    existingRating,
    onCompleteSession,
    isCompleting,
}: HostVerdictProps) {
    const [pending, setPending] = useState<EvaluationRating | null>(null);

    const evaluate = useMutation({
        mutationFn: (rating: EvaluationRating) =>
            evaluationApi.evaluate({ sessionId, participantId: candidateId!, rating }),
        onSuccess: (_data, rating) => {
            setPending(null);
            toast.success(`Marked ${RATING_LABELS[rating].toLowerCase()}`);
        },
        onError: (error) => {
            setPending(null);
            toast.error(error.message || "Couldn't save the rating");
        },
    });

    const canEvaluate =
        !!candidateId && status === "completed" && mode === "interview" && !evaluate.isPending;

    const reason = !candidateId
        ? "Waiting for the candidate to join"
        : mode !== "interview"
          ? "Ratings apply to interview sessions only"
          : status !== "completed"
            ? "Complete the session to rate the candidate"
            : null;

    return (
        <div className="flex flex-col gap-2 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                Verdict
            </span>

            {status === "live" && (
                <Button size="sm" variant="primary" loading={isCompleting} onClick={onCompleteSession}>
                    Complete session
                </Button>
            )}

            <div className="grid grid-cols-3 gap-1.5">
                {RATINGS.map((rating) => {
                    const isActive = existingRating === rating;
                    const isPending = pending === rating && evaluate.isPending;

                    return (
                        <button
                            key={rating}
                            type="button"
                            disabled={!canEvaluate}
                            onClick={() => {
                                setPending(rating);
                                evaluate.mutate(rating);
                            }}
                            className={cn(
                                "rounded px-2 py-1.5 text-xs font-medium transition-colors",
                                "disabled:cursor-not-allowed disabled:opacity-50",
                                isActive
                                    ? RATING_BADGES[rating]
                                    : "border border-border text-muted hover:border-border-strong hover:text-fg"
                            )}
                            title={isActive ? "Current rating" : `Rate ${RATING_LABELS[rating].toLowerCase()}`}
                        >
                            {isPending ? "…" : RATING_LABELS[rating]}
                        </button>
                    );
                })}
            </div>

            {reason && <p className="text-[11px] leading-relaxed text-muted">{reason}</p>}

            {existingRating && !reason && (
                <p className="text-[11px] text-success">
                    Saved as {RATING_LABELS[existingRating].toLowerCase()}.
                </p>
            )}
        </div>
    );
}
