import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { EvaluationRating, SessionDetail } from "@algorym/shared-types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RATING_BADGES, RATING_LABELS } from "@/features/sessions/constants";
import { evaluationApi } from "@/lib/api";
import { cn } from "@/lib/utils/cn";

const RATINGS: EvaluationRating[] = ["weak", "average", "strong"];

interface RatingCardProps {
    session: SessionDetail;
    className?: string;
}

/**
 * The host's rating of the candidate, editable after the fact.
 *
 * **Why this exists:** the room's rating form is only reachable between completing and
 * leaving, so "Rate later" used to be a one-way door — the host would have to remember,
 * and there was nowhere on the page to change their mind. A rating is a judgement call and
 * judgements get revised, so the session detail page has to allow it. Otherwise the value
 * quietly becomes permanent the first time it is picked.
 *
 * Saves through `POST /api/evaluation`, which is an `ON CONFLICT ... DO UPDATE` upsert, so
 * editing is the same call as first rating — no second endpoint and no risk of the two paths
 * disagreeing.
 *
 * Restricted to **completed interviews** because that is the only thing a rating means:
 * a cancelled session has no evaluation, and a practice session is not assessed. The
 * endpoint is owner-scoped regardless, so a non-host cannot reach the data either way.
 */
export function RatingCard({ session, className }: RatingCardProps) {
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState<EvaluationRating | null>(null);
    const [saving, setSaving] = useState(false);

    const candidateId = session.candidate_participant_id;
    const isInterview = session.mode === "interview";
    const canRate = session.status === "completed" && isInterview && !!candidateId;

    // Draft stays null until the host picks something, so the stored value is never
    // copied into state by an effect — it just flows through.
    const rating = draft ?? (session.rating as EvaluationRating | null) ?? null;

    if (!canRate) return null;

    const save = () => {
        if (!rating) return;
        setSaving(true);
        void evaluationApi
            .evaluate({
                sessionId: session.id,
                participantId: candidateId,
                rating,
                // Notes are edited in their own card; pass them through unchanged so
                // this request cannot blank them.
                notes: session.notes ?? "",
            })
            .then(() => queryClient.invalidateQueries({ queryKey: ["session", session.id] }))
            .then(() => {
                setDraft(null);
                setIsEditing(false);
                toast.success("Rating updated");
            })
            .catch((err: unknown) =>
                toast.error(err instanceof Error ? err.message : "Couldn't save the rating")
            )
            .finally(() => setSaving(false));
    };

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="shrink-0">
                <CardTitle>Rating</CardTitle>
                {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.7}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-3.5"
                            aria-hidden="true"
                        >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                        </svg>
                        {rating ? "Change" : "Add rating"}
                    </Button>
                )}
            </CardHeader>

            <CardContent>
                {isEditing ? (
                    <div className="flex flex-col gap-3">
                        <p className="text-xs leading-relaxed text-muted">
                            Your first impression is a starting point, not a verdict — change it
                            whenever you need to.
                        </p>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {RATINGS.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={rating === value}
                                    onClick={() => setDraft(value)}
                                    className={cn(
                                        "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                                        rating === value
                                            ? RATING_BADGES[value]
                                            : "border-border text-muted hover:border-border-strong hover:text-fg"
                                    )}
                                >
                                    {RATING_LABELS[value]}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={saving}
                                onClick={() => {
                                    setDraft(null);
                                    setIsEditing(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                loading={saving}
                                disabled={!rating}
                                onClick={save}
                            >
                                Save rating
                            </Button>
                        </div>
                    </div>
                ) : rating ? (
                    <div className="flex items-center gap-3">
                        <span
                            className={cn(
                                "rounded-full px-3 py-1 text-sm font-semibold",
                                RATING_BADGES[rating]
                            )}
                        >
                            {RATING_LABELS[rating]}
                        </span>
                        <span className="text-xs text-muted">
                            Rated by you for this interview
                        </span>
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
                        <p className="text-sm font-medium text-fg">Not rated yet</p>
                        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">
                            You can rate this candidate now, or later from this page — it stays
                            editable either way.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}