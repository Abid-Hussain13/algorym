import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { RATING_BADGES, RATING_LABELS } from "@/features/sessions";
import { evaluationApi, sessionsApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import type { EvaluationRating } from "@algorym/shared-types";

interface SessionActionsPanelProps {
    sessionId: string;
    candidateId: string | null;
    mode: string;
    status: string;
    existingRating: EvaluationRating | null;
    /** Notes saved during the session, so the rating form opens populated. */
    existingNotes: string | null;
    onComplete: () => void;
    onCancel: () => void;
    isCompleting: boolean;
    isCancelling: boolean;
}

const RATINGS: EvaluationRating[] = ["weak", "average", "strong"];

/**
 * End the session, then judge it — in that order, in one place.
 *
 * **Step 1 is only Complete and Cancel.** Nothing else lives here: not the notes,
 * not the ratings. While a session is live the host's attention belongs on the
 * interview, and a rating form sitting one click away invites a snap judgement.
 * Notes stay where they were written — the Notes tab.
 *
 * **Step 2 appears only after completing**, and asks for a rating plus notes
 * pre-filled from what the host wrote during the session, freely editable.
 *
 * Two exits, because rating is optional and must never feel mandatory:
 * **Done** saves and leaves, **Rate later** skips and leaves. Both land on the
 * sessions page — the room has nothing left to do, and the rating remains
 * reachable from the session detail page.
 *
 * Cancelling asks for confirmation because there is no undo; completing does not.
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
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [confirmingCancel, setConfirmingCancel] = useState(false);
    const [draftRating, setDraftRating] = useState<EvaluationRating | null>(null);
    const [draftNotes, setDraftNotes] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Drafts stay null until the host changes something, so the server values
    // flow through untouched instead of being copied into state by an effect.
    const rating = draftRating ?? existingRating;
    const notes = draftNotes ?? existingNotes ?? "";

    const isLive = status === "live";
    const isCompleted = status === "completed";
    const isCancelled = status === "cancelled";

    const canEvaluate = !!candidateId && isCompleted && mode === "interview" && !isCancelled;

    const goToSessions = () => navigate("/app/sessions");

    const submit = async () => {
        if (!candidateId || !rating) return;

        setSaving(true);
        setError(null);
        try {
            await evaluationApi.evaluate({ sessionId, participantId: candidateId, rating, notes });
            await queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
            setSaved(true);
            goToSessions();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't save the evaluation");
            setSaving(false);
        }
    };

    const rateLater = async () => {
        // Persist whatever notes were typed before leaving, so nothing is lost.
        if (notes !== (existingNotes ?? "")) {
            setSaving(true);
            try {
                await sessionsApi.saveNotes(sessionId, notes);
                await queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
            } catch {
                /* leaving anyway; the notes simply stay unsaved */
            }
            setSaving(false);
        }
        goToSessions();
    };

    /* ── Step 1: end it ────────────────────────────────────────────── */
    if (isLive || (!isCompleted && !isCancelled)) {
        return (
            <div className="flex flex-col gap-2 p-3">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    End session
                </span>

                {isLive && (
                    <Button variant="primary" size="sm" loading={isCompleting} onClick={onComplete}>
                        Complete session
                    </Button>
                )}

                {!isLive && !isCompleted && !isCancelled && (
                    <p className="text-[11px] text-muted">This session is {status}.</p>
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
            </div>
        );
    }

    /* ── Step 2: judge it ───────────────────────────────────────────── */
    if (isCancelled) {
        return (
            <div className="flex flex-col gap-3 p-3">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    Session cancelled
                </span>
                <p className="text-[11px] leading-relaxed text-muted">
                    This session was cancelled, so it cannot be rated.
                </p>
                <Button variant="primary" size="sm" onClick={goToSessions}>
                    Go to sessions
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                Evaluate candidate
            </span>

            {!candidateId && (
                <p className="text-[11px] leading-relaxed text-muted">
                    No candidate joined this session, so there is nobody to rate.
                </p>
            )}

            {candidateId && mode !== "interview" && (
                <p className="text-[11px] leading-relaxed text-muted">
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
                <label htmlFor="evaluation-notes" className="text-[11px] text-muted">
                    Notes
                </label>
                <textarea
                    id="evaluation-notes"
                    value={notes}
                    onChange={(event) => {
                        setDraftNotes(event.target.value);
                        setSaved(false);
                    }}
                    placeholder="What did you observe? These notes are private."
                    className="min-h-32 resize-y rounded border border-border bg-surface-2/40 px-2.5 py-2 text-xs leading-relaxed text-fg placeholder:text-muted/70"
                />
            </div>

            {error && <p className="text-[11px] text-danger">{error}</p>}
            {saved && <p className="text-[11px] text-success">Saved. Taking you to your sessions…</p>}

            <div className="flex flex-col gap-1.5">
                <Button
                    variant="primary"
                    size="sm"
                    loading={saving}
                    disabled={!canEvaluate || !rating}
                    onClick={() => void submit()}
                >
                    Done
                </Button>
                <Button variant="ghost" size="sm" loading={saving} onClick={() => void rateLater()}>
                    Rate later
                </Button>
            </div>
        </div>
    );
}
