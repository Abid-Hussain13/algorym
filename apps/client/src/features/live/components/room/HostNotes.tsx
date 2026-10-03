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
    canEdit: boolean;
}

const SAVE_DEBOUNCE = 1200;

/**
 * Private interview notes — host only.
 *
 * Saves on a debounce rather than per keystroke so a fast typist does not fire a
 * request per character. The save is intentionally silent on success (a toast
 * every 1.2s would be unusable) and loud on failure, because silently losing an
 * interviewer's notes is the one outcome worth avoiding.
 */
export function HostNotes({ sessionId, initialNotes, canEdit }: HostNotesProps) {
    // `draft` stays null until the host actually types, so the server's value
    // flows through untouched. Deriving it this way avoids an effect that
    // syncs a prop into state, which re-renders on every save.
    const [draft, setDraft] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();

    const notes = draft ?? initialNotes ?? "";
    const isDirty = notes !== (initialNotes ?? "");

    useEffect(() => {
        if (!canEdit || !isDirty) return;

        const timer = setTimeout(async () => {
            setIsSaving(true);
            try {
                await sessionsApi.saveNotes(sessionId, notes);
                await queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
            } catch {
                toast.error("Couldn't save notes — check your connection");
            } finally {
                setIsSaving(false);
            }
        }, SAVE_DEBOUNCE);

        return () => clearTimeout(timer);
    }, [notes, isDirty, canEdit, sessionId, queryClient]);

    if (!canEdit) return null;

    return (
        <div className="flex h-full min-h-0 flex-col gap-2 p-3">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    Private notes
                </span>
                {isSaving && (
                    <span className="flex items-center gap-1.5 text-[11px] text-muted">
                        <Spinner size="sm" />
                        Saving
                    </span>
                )}
            </div>

            <textarea
                value={notes}
                onChange={(event) => setDraft(event.target.value)}
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
