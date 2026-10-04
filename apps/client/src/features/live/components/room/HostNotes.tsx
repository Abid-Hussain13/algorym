import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "sonner";
import { sessionsApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface HostNotesProps {
    sessionId: string;
    /** Seed value from the host's existing notes, when any. */
    initialNotes: string | null;
    /**
     * Whether a save would actually succeed right now. Notes are stored against a
     * candidate (`session_evaluations.evaluated_participant_id` is NOT NULL), so
     * the server rejects them until a guest has joined.
     */
    canSave: boolean;
    /** Why `canSave` is false, shown inline. */
    blockedReason?: string | null;
}

const SAVE_DEBOUNCE = 1200;

type SaveState = "idle" | "saving" | "saved" | "failed";

/**
 * Private interview notes — host only, in the Notes tab under the editor.
 *
 * **The textarea stays editable even when saving is impossible.** A host who
 * wants to jot something down before the candidate connects should be able to;
 * the draft simply stays unsaved and is written the moment a candidate appears
 * (the save effect re-runs because `canSave` is in its dependencies).
 *
 * The alternative — a disabled box — reads as "broken", and the previous version
 * was worse still: it fired saves that failed with a 400 and reported
 * *"Couldn't save notes — check your connection"*, which sent the host hunting
 * for a network problem that did not exist. Errors now show what the server
 * actually said.
 */
export function HostNotes({ sessionId, initialNotes, canSave, blockedReason }: HostNotesProps) {
    // `draft` stays null until the host actually types, so the server's value
    // flows through untouched instead of being copied into state by an effect.
    const [draft, setDraft] = useState<string | null>(null);
    const [state, setState] = useState<SaveState>("idle");
    const queryClient = useQueryClient();

    const notes = draft ?? initialNotes ?? "";
    const isDirty = notes !== (initialNotes ?? "");

    useEffect(() => {
        if (!canSave || !isDirty) return;

        const timer = setTimeout(async () => {
            setState("saving");
            try {
                await sessionsApi.saveNotes(sessionId, notes);
                await queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
                setDraft(null); // the server now holds this text
                setState("saved");
            } catch (error) {
                setState("failed");
                // Surface the real reason — "no candidate yet" and "offline" need
                // very different responses from the host.
                const message =
                    error instanceof Error && error.message ? error.message : "Couldn't save notes";
                toast.error(message);
            }
        }, SAVE_DEBOUNCE);

        return () => clearTimeout(timer);
    }, [notes, isDirty, canSave, sessionId, queryClient]);

    return (
        <div className="flex h-full min-h-0 flex-col gap-2 p-3">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    Private notes
                </span>

                <span className="flex items-center gap-2 text-[11px]">
                    {!canSave && isDirty && (
                        <span className="text-warning">Draft — not saved yet</span>
                    )}
                    {state === "saving" && (
                        <span className="flex items-center gap-1.5 text-muted">
                            <Spinner size="sm" />
                            Saving
                        </span>
                    )}
                    {state === "saved" && canSave && !isDirty && (
                        <span className="text-success">Saved</span>
                    )}
                    {state === "failed" && <span className="text-danger">Not saved</span>}
                </span>
            </div>

            {!canSave && (
                <p className="rounded border border-warning/30 bg-warning/10 px-2 py-1.5 text-[11px] leading-relaxed text-fg">
                    {blockedReason ?? "Notes cannot be saved yet."}{" "}
                    {isDirty ? "Anything you type now is kept and saved automatically." : null}
                </p>
            )}

            <textarea
                value={notes}
                onChange={(event) => {
                    setDraft(event.target.value);
                    setState("idle");
                }}
                placeholder="What are you noticing? Only you can see this."
                className="min-h-0 flex-1 resize-none rounded border border-border bg-bg px-2.5 py-2 text-xs leading-relaxed text-fg placeholder:text-muted/70"
            />

            <div className="flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => setDraft(null)} disabled={!isDirty}>
                    Reset
                </Button>
            </div>
        </div>
    );
}
