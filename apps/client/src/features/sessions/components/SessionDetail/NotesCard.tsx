import { useState } from "react";
import { toast } from "sonner";
import type { SessionDetail } from "@algorym/shared-types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useSaveNotes } from "../../hooks/use-save-notes";
import { cn } from "@/lib/utils/cn";

interface NotesCardProps {
    session: SessionDetail;
    className?: string;
}

export function NotesCard({ session, className }: NotesCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(session.notes ?? "");
    const saveNotes = useSaveNotes(session.id);

    const notes = session.notes ?? "";
    const canEdit = session.status === "live" || session.status === "completed";

    const handleEdit = () => {
        setDraft(notes);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setDraft(notes);
        setIsEditing(false);
    };

    const handleSave = () => {
        saveNotes.mutate(draft, {
            onSuccess: () => {
                setIsEditing(false);
                toast.success("Notes saved");
            },
            onError: (err) => {
                toast.error(err instanceof Error ? err.message : "Failed to save notes");
            },
        });
    };

    return (
        <Card className={cn("flex h-full flex-col", className)}>
            <CardHeader>
                <CardTitle>Notes</CardTitle>
                {canEdit && !isEditing ? (
                    <Button variant="ghost" size="sm" onClick={handleEdit}>
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
                        Edit
                    </Button>
                ) : null}
            </CardHeader>

            <CardContent className="flex flex-1 flex-col">
                {isEditing ? (
                    <div className="flex flex-1 flex-col gap-3">
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={10}
                            autoFocus
                            placeholder="Write your observations about this candidate strengths, weaknesses, hiring recommendation…"
                            className="min-h-[200px] w-full flex-1 resize-y rounded-lg border border-border bg-surface px-3.5 py-3 font-body text-sm leading-relaxed text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                        />
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                                disabled={saveNotes.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSave}
                                loading={saveNotes.isPending}
                            >
                                Save Notes
                            </Button>
                        </div>
                    </div>
                ) : notes ? (
                    <div className="flex flex-1 flex-col">
                        <p className="whitespace-pre-wrap break-words font-body text-sm leading-relaxed text-fg">
                            {notes}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center">
                        <div className="grid size-10 place-items-center rounded-full bg-surface">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.7}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-5 text-muted"
                                aria-hidden="true"
                            >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6" />
                                <path d="M16 13H8" />
                                <path d="M16 17H8" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-fg">No notes yet</p>
                        <p className="max-w-xs text-xs leading-relaxed text-muted">
                            {canEdit
                                ? "Record your observations about this candidate — they stay attached to this session."
                                : "Notes become available once the session goes live."}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
