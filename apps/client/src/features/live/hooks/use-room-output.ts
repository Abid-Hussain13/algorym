import { useEffect, useState } from "react";
import type { RunResultPayload } from "@algorym/shared-types";
import type { SessionSocket } from "./use-session-socket";

export interface RoomOutputEntry {
    /** Stable key for React — two identical runs must not collapse. */
    key: string;
    actorParticipantId: string;
    isSelf: boolean;
    /** Echo of the HTTP `runId`, so the presser's local card can be dropped. */
    runId?: string;
    result: RunResultPayload;
    receivedAt: number;
}

/** Keep memory bounded in a long interview; the replay uses persisted events. */
const MAX_ENTRIES = 50;

let receivedCount = 0;

/**
 * Collects `run_result` broadcasts so the output panel shows what **everyone** in
 * the room ran, in the order the runs completed (oldest first, appended as they
 * arrive).
 *
 * The presser also receives their own result over HTTP via `useRunCode`; that
 * local card is shown only until this feed carries the same `runId`, which is
 * reconciled in `OutputPanel`.
 */
export function useRoomOutput(
    socket: SessionSocket,
    selfParticipantId: string | undefined
): RoomOutputEntry[] {
    const [entries, setEntries] = useState<RoomOutputEntry[]>([]);

    // `subscribe` is a stable useCallback; depending on the `socket` object
    // instead would re-subscribe on every render of the room.
    const { subscribe } = socket;

    useEffect(
        () =>
            subscribe((message) => {
                if (message.type !== "run_result") return;

                // Two runs in the same millisecond must not share a React key,
                // so a monotonic counter is mixed into the id.
                receivedCount += 1;
                const receivedAt = Date.now();

                const entry: RoomOutputEntry = {
                    key: `${message.actorParticipantId}-${receivedAt}-${receivedCount}`,
                    actorParticipantId: message.actorParticipantId,
                    isSelf: message.actorParticipantId === selfParticipantId,
                    runId: message.runId,
                    result: message.payload,
                    receivedAt,
                };

                setEntries((prev) => [...prev, entry].slice(-MAX_ENTRIES));
            }),
        [subscribe, selfParticipantId]
    );

    return entries;
}
