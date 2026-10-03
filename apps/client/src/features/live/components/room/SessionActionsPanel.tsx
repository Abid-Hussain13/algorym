import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { RATING_BADGES, RATING_LABELS } from "@/features/sessions";
import { evaluationApi, sessionsApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import { HostNotes } from "./HostNotes";
import type { EvaluationRating } from "@algorym/shared-types";

interface SessionActionsPanelProps {
    sessionId: string;
    candidateId: string | null;
    mode: string;
    status: string;
    existingRating: EvaluationRating | null;
    /** Notes already saved for this session, so the form opens populated. */
    existingNotes: string | null;
    onComplete: () => void;
    onCancel: () => void;
    isCompleting: boolean;
    isCancelling: boolean;
}

const RATINGS: EvaluationRating[] = ["weak", "average", "strong"];

/**
 * The one place a session can be ended, and then judged.
 *
 * It is a **two-step flow on purpose**:
 *
 * 1. **End the session** — Complete or Cancel. Nothing else on this page.
 * 2. **Only after completing**, the evaluation form appears: a rating and the
 *    notes, pre-filled with whatever the host already wrote during the session.
 *
 * Asking for a verdict *before* the interview is over invites a snap judgement,
 * and it also would not work — the server rejects evaluation until the session
 * is completed.
 *
 * Cancelling asks for confirmation because there is no undo; completing does not,
 * since it keeps everything.
 */
export function SessionActionsPanel({
    sessionId,
    candidateId,
    mode,
    status,
    existingRating,
    existingNotes,
    onComplete,
    onCancel,
    isCompleting,
    isCancelling,
}: SessionActionsPanelProps) {
    const [confirmingCancel, setConfirmingCancel] = useState(false);
    // Drafts stay null until the host actually changes something, so the server
    // values flow through untouched. Deriving it this way avoids an effect that
    // syncs a prop into state, which re-renders on every save.
    const [draftRating, setDraftRating] = useState<EvaluationRating | null>(null);
    const [draftNotes, setDraftNotes] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const queryClient = useQueryClient();

    const rating = draftRating ?? existingRating;
    const notes = draftNotes ?? existingNotes ?? "";

    const isLive = status === "live";
    const isCompleted = status === "completed";
    const isCancelled = status === "cancelled";
    const showEvaluation = isCompleted || isCancelled;

    const canEvaluate =
        !!candidateId && isCompleted && mode === "interview" && !isCancelled;

    const submit = async () => {
        if (!candidateId || !rating) return;

        await evaluationApi.evaluate({ sessionId, participantId: candidateId, rating, notes });
        await queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
        setSaved(true);
    };

    const saveNotesOnly = async () => {
        await sessionsApi.saveNotes(sessionId, notes);
        await queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
        setSaved(true);
    };

    return (
        <div className="flex flex-col gap-5 p-3">
            {/* ── Step 1 ─────────────────────────────────────────────── */}
            {!showEvaluation && (
                <section className="flex flex-col gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                        End session
                    </span>

                    {isLive && (
                        <Button variant="primary" size="sm" loading={isCompleting} onClick={onComplete}>
                            Complete session
                        </Button>
                    )}

                    {confirmingCancel ? (
                        <div className="flex flex-col gap-1.5 rounded border border-danger/40 bg-danger/5 p-2">
                            <p className="text-[11px] leading-relaxed text-fg">
                                Cancel this session? The candidate is disconnected and it is recorded as
                                cancelled. This cannot be undone.
                            </p>
                            <div className="flex gap-1.5">
                                <Button
                                    variant="default"
                                    size="sm"
                                    loading={isCancelling}
                                    onClick={onCancel}
                                    className="bg-danger border-danger text-on-accent hover:bg-danger/90 hover:border-danger/90"
                                >
                                    Yes, cancel
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setConfirmingCancel(false)}>
                                    Keep it
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="default"
                            size="sm"
                            loading={isCancelling}
                            onClick={() => setConfirmingCancel(true)}
                            className="border-danger/50 text-danger hover:bg-danger/10 hover:border-danger"
                        >
                            Cancel session
                        </Button>
                    )}
                </section>
            )}

            {/* ── Step 2 ─────────────────────────────────────────────── */}
            {showEvaluation && (
                <section className="flex flex-col gap-3">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                        Evaluate candidate
                    </span>

                    {isCancelled ? (
                        <p className="text-[11px] leading-relaxed text-muted">
                            This session was cancelled, so it cannot be rated.
                        </p>
                    ) : (
                        <>
                            {!candidateId && (
                                <p className="text-[11px] text-muted">
                                    No candidate joined this session, so there is nobody to rate.
                                </p>
                            )}

                            {mode !== "interview" && (
                                <p className="text-[11px] text-muted">
                                    Ratings apply to interview sessions only — this was a practice session.
                                </p>
                            )}

                            <div className="grid grid-cols-3 gap-1.5">
                                {RATINGS.map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        disabled={!canEvaluate}
                                        onClick={() => {
                                            setDraftRating(value);
                                            setSaved(false);
                                        }}
                                        className={cn(
                                            "rounded px-2 py-1.5 text-xs font-medium transition-colors",
                                            "disabled:cursor-not-allowed disabled:opacity-50",
                                            rating === value
                                                ? RATING_BADGES[value]
                                                : "border border-border text-muted hover:border-border-strong hover:text-fg"
                                        )}
                                    >
                                        {RATING_LABELS[value]}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] text-muted">Notes</span>
                                <textarea
                                    value={notes}
                                    onChange={(event) => {
                                        setDraftNotes(event.target.value);
                                        setSaved(false);
                                    }}
                                    placeholder="What did you observe? These notes are private."
                                    className="min-h-32 resize-y rounded border border-border bg-surface-2/40 px-2.5 py-2 text-xs leading-relaxed text-fg placeholder:text-muted/70"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    disabled={!canEvaluate || !rating}
                                    onClick={() => void submit()}
                                >
                                    Save evaluation
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => void saveNotesOnly()}>
                                    Save notes only
                                </Button>
                            </div>

                            {saved && (
                                <p className="text-[11px] text-success">
                                    Saved{rating ? ` as ${RATING_LABELS[rating].toLowerCase()}` : ""}.
                                </p>
                            )}
                        </>
                    )}
                </section>
            )}

            {/* Notes typed during the session stay reachable either way. */}
            {!showEvaluation && isLive && (
                <section className="border-t border-border pt-3">
                    <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted">
                        Notes in progress
                    </span>
                    <HostNotes sessionId={sessionId} initialNotes={existingNotes} canEdit />
                </section>
            )}
        </div>
    );
}
