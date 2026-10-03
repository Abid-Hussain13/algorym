import { cn } from "@/lib/utils/cn";
import type { RoomOutputEntry } from "../../hooks/use-room-output";
import type { RunStatus } from "@algorym/shared-types";

const STATUS_STYLES: Record<RunStatus, string> = {
    accepted: "bg-success/10 text-success",
    wrong_answer: "bg-danger/10 text-danger",
    time_limit_exceeded: "bg-warning/10 text-warning",
    compile_error: "bg-danger/10 text-danger",
    runtime_error: "bg-danger/10 text-danger",
    internal_error: "bg-danger/10 text-danger",
    error: "bg-danger/10 text-danger",
};

const STATUS_LABELS: Record<RunStatus, string> = {
    accepted: "Accepted",
    wrong_answer: "Wrong answer",
    time_limit_exceeded: "Time limit exceeded",
    compile_error: "Compile error",
    runtime_error: "Runtime error",
    internal_error: "Internal error",
    error: "Error",
};

const outputOf = (result: RoomOutputEntry["result"]) =>
    result.compile_output || result.stderr || result.stdout || "";

interface OutputPanelProps {
    entries: RoomOutputEntry[];
    /** Result of the run this user just triggered, which has not echoed back yet. */
    localResult: RoomOutputEntry["result"] | null;
    isRunning: boolean;
    /** Name lookup so a run can be attributed to a person, not an id. */
    nameFor: (participantId: string) => string;
}

const RunCard = ({ result, name }: { result: RoomOutputEntry["result"]; name: string }) => {
    const output = outputOf(result);

    return (
        <li className="flex flex-col gap-1.5 border-b border-border/60 px-3 py-2 last:border-b-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-medium text-fg">{name}</span>
                <span
                    className={cn(
                        "rounded px-1.5 py-0.5 font-medium",
                        STATUS_STYLES[result.status] ?? "bg-muted/10 text-muted"
                    )}
                >
                    {STATUS_LABELS[result.status] ?? result.status}
                </span>
                {result.time !== null && (
                    <span className="text-muted">{result.time.toFixed(2)}s</span>
                )}
                {result.memory !== null && (
                    <span className="text-muted">{(result.memory / 1024).toFixed(1)} MB</span>
                )}
            </div>

            {output ? (
                <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-surface-2/60 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-fg">
                    {output}
                </pre>
            ) : (
                <p className="text-[11px] text-muted">No output.</p>
            )}
        </li>
    );
};

/**
 * Everything anyone in the room has run, newest first.
 *
 * The local run appears twice — once as `localResult` (the HTTP answer, instant)
 * and again as a broadcast a moment later. Rather than reconcile the two, the
 * local one is only shown when no broadcast for this run has arrived yet; after
 * that the broadcast entry takes over and there is exactly one card per run.
 */
export function OutputPanel({ entries, localResult, isRunning, nameFor }: OutputPanelProps) {
    const hasBroadcastForLatest = entries.length > 0 && entries[0].isSelf;

    if (isRunning) {
        return (
            <p className="px-3 py-3 text-xs text-muted" role="status">
                Running…
            </p>
        );
    }

    if (!entries.length && !localResult) {
        return (
            <p className="px-3 py-3 text-xs text-muted">
                No output yet. Press <span className="font-mono">Run</span> to execute the active file.
            </p>
        );
    }

    return (
        <ul className="flex flex-col">
            {localResult && !hasBroadcastForLatest && (
                <RunCard result={localResult} name="You" />
            )}
            {entries.map((entry) => (
                <RunCard key={entry.key} result={entry.result} name={nameFor(entry.actorParticipantId)} />
            ))}
        </ul>
    );
}
