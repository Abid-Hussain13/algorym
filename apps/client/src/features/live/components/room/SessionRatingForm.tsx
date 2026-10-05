import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { RATING_BADGES, RATING_LABELS } from "@/features/sessions";
import { evaluationApi, sessionsApi } from "@/lib/api";
import { cn } from "@/lib/utils/cn";
import type { EvaluationRating } from "@algorym/shared-types";

interface SessionRatingFormProps {
    sessionId: string;
    candidateId: string | null;
    mode: string;
    status: string;
    existingRating: EvaluationRating | null;
    /** Notes saved during the session, so the form opens populated. */
    existingNotes: string | null;
}

const RATINGS: EvaluationRating[] = ["weak", "average", "strong"];

/**
 * Step two of ending a session: judge it.
 *
 * Only ever shown once the session is already complete. While it is live the
 * host's attention belongs on the interview, and a rating form sitting one click
 * away invites a snap judgement — so nothing rates until the interview is over.
 *
 * Notes arrive pre-filled from whatever the host wrote during the session and
 * stay freely editable.
 *
 * Two exits, because rating is optional and must never feel mandatory:
 * **Done** saves and leaves, **Rate later** skips and leaves. Both land on the
 * sessions page, and the rating stays reachable from the session detail page.
 */
export function SessionRatingForm({
    sessionId,
    candidateId,
    mode,
    status,
    existingRating,
    existingNotes,
}: SessionRatingFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [draftRating, setDraftRating] = useState<EvaluationRating | null>(null);
    const [draftNotes, setDraftNotes] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Drafts stay null until the host changes something, so the server values
    // flow through untouched instead of being copied into state by an effect.
    const rating = draftRating ?? existingRating;
    const notes = draftNotes ?? existingNotes ?? "";

    const isCancelled = status === "cancelled";
    const canEvaluate = !!candidateId && status === "completed" && mode === "interview";

    const goToSessions = () => navigate("/app/sessions");

    const submit = async () => {
        if (!candidateId || !rating) return;

        setSaving(true);
        setError(null);
        try {
            await evaluationApi.evaluate({ sessionId, participantId: candidateId, rating, notes });
            await queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
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

    if (isCancelled) {
        return (
            <div className="flex flex-col gap-2">
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
        <div className="flex flex-col gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Evaluate candidate
            </span>

            {!candidateId && (
                <p className="text-[11px] leading-relaxed text-muted">
                    No candidate joined this session, so there is nobody to rate.
                </p>
            )}

            {candidateId && mode !== "interview" && (
                <p className="text-[11px] leading-relaxed text-muted">
                    Ratings apply to interview sessions only. This was a practice session.
                </p>
            )}

            <div className="grid grid-cols-3 gap-1.5">
                {RATINGS.map((value) => (
                    <button
                        key={value}
                        type="button"
                        disabled={!canEvaluate}
                        onClick={() => setDraftRating(value)}
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
                    onChange={(event) => setDraftNotes(event.target.value)}
                    placeholder="What did you observe? These notes are private."
                    className="min-h-28 resize-y rounded border border-border bg-surface-2/40 px-2.5 py-2 text-xs leading-relaxed text-fg placeholder:text-muted/70"
                />
            </div>

            {error && <p className="text-[11px] text-danger">{error}</p>}

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
