import { STATUS_BADGES, STATUS_LABELS } from "@/features/sessions";
import { useNow } from "../../hooks/use-now";
import type { Collaborator } from "../../hooks/use-collaborators";
import { cn } from "@/lib/utils/cn";
import type { EvaluationRating, RoomSession } from "@algorym/shared-types";
import { CandidateIntegritySection, FullscreenControl } from "./CandidateIntegritySection";
import { EditorPreferencesSection } from "./EditorPreferencesSection";
import { SessionEndControls } from "./SessionEndControls";
import { SessionRatingForm } from "./SessionRatingForm";
import { SettingsCard, SettingsRow, SettingsSection } from "./SettingsSection";

interface SessionSettingsPanelProps {
    session: RoomSession | null;
    collaborators: Collaborator[];
    isHost: boolean;
    sessionId: string;
    candidateId: string | null;
    existingRating: EvaluationRating | null;
    existingNotes: string | null;
    onComplete: () => void;
    onCancel: () => void;
    isCompleting: boolean;
    isCancelling: boolean;
    onCopyInvite?: () => void;
}

/**
 * Everything about the room that the host can check or change, in one sidebar
 * panel: read-only facts, the live integrity readout, per-user editor settings,
 * and the two ways to end the session.
 *
 * Why one panel: every decision a host makes mid-interview lives here, and
 * splitting them across a rail gave the destructive actions a tab of their own,
 * one stray click from the question list.
 *
 * Ordering carries meaning. Everything neutral is first, integrity sits at the
 * very top because it is the only thing that can change from bad to worse on its
 * own, and the two destructive buttons are last — reached only after scrolling
 * past read-only content, so they are reachable without ever being the first
 * thing on screen.
 *
 * Each user's editor mode, font size and theme are stored per browser, so two
 * people in one room can have entirely different setups.
 */
export function SessionSettingsPanel({
    session,
    collaborators,
    isHost,
    sessionId,
    candidateId,
    existingRating,
    existingNotes,
    onComplete,
    onCancel,
    isCompleting,
    isCancelling,
    onCopyInvite,
}: SessionSettingsPanelProps) {
    // The clock is an external system, so it is subscribed to rather than read
    // during render (which would be impure and would never tick anyway).
    // Declared before the early return to respect the Rules of Hooks.
    const now = useNow(30_000);

    if (!session) return <p className="p-4 text-xs text-muted">Loading…</p>;

    const startedAt = session.started_at ? new Date(session.started_at).getTime() : null;
    const elapsedMinutes = startedAt !== null ? Math.floor((now - startedAt) / 60000) : null;
    const durationMinutes = session.duration_minutes;

    return (
        <div className="flex flex-col gap-5 px-4 py-4">
            <CandidateIntegritySection isHost={isHost} collaborators={collaborators} />

            <SettingsSection
                title="Session"
                description="Read-only facts about this interview."
            >
                <dl className="divide-y divide-border/40">
                    <SettingsRow label="Status">
                        <span
                            className={cn(
                                "rounded px-1.5 py-0.5 text-[11px] font-medium",
                                STATUS_BADGES[session.status] || "bg-muted/10 text-muted"
                            )}
                        >
                            {STATUS_LABELS[session.status] || session.status}
                        </span>
                    </SettingsRow>
                    <SettingsRow label="Role">{isHost ? "Host (you)" : "Candidate"}</SettingsRow>
                    <SettingsRow label="Mode">
                        <span className="capitalize">{session.mode}</span>
                    </SettingsRow>
                    <SettingsRow label="Language">{session.language ?? "Not set"}</SettingsRow>
                    <SettingsRow label="In the room">
                        {collaborators.length} {collaborators.length === 1 ? "person" : "people"}
                    </SettingsRow>
                    {session.role_context && (
                        <SettingsRow label="Focus">{session.role_context}</SettingsRow>
                    )}
                    {elapsedMinutes !== null && (
                        <SettingsRow label="Elapsed">{elapsedMinutes} min</SettingsRow>
                    )}
                    {durationMinutes && (
                        <SettingsRow label="Planned">{durationMinutes} min</SettingsRow>
                    )}
                </dl>

                {isHost && (
                    <SettingsCard>
                        <FullscreenControl isHost={isHost} />
                        {onCopyInvite && (
                            <button
                                type="button"
                                onClick={onCopyInvite}
                                className="mt-3 w-full rounded border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
                            >
                                Copy invite link
                            </button>
                        )}
                    </SettingsCard>
                )}
            </SettingsSection>

            <SettingsSection
                title="Your editor"
                description="Saved on this device, so nobody else's setup affects yours."
            >
                <SettingsCard>
                    <EditorPreferencesSection />
                </SettingsCard>
            </SettingsSection>

            {/* The rating form only appears once the interview is already over, so
                it cannot be reached by snap judgement while it is running. */}
            {isHost && (session.status === "completed" || session.status === "cancelled") && (
                <SettingsSection title="Evaluate candidate">
                    <SettingsCard>
                        <SessionRatingForm
                            sessionId={sessionId}
                            candidateId={candidateId}
                            mode={session.mode}
                            status={session.status}
                            existingRating={existingRating}
                            existingNotes={existingNotes}
                        />
                    </SettingsCard>
                </SettingsSection>
            )}

            {isHost && (
                <SettingsSection
                    title="End session"
                    description="Completing lets you rate the candidate. Cancelling cannot be undone."
                >
                    <SessionEndControls
                        status={session.status}
                        onComplete={onComplete}
                        onCancel={onCancel}
                        isCompleting={isCompleting}
                        isCancelling={isCancelling}
                    />
                </SettingsSection>
            )}
        </div>
    );
}
