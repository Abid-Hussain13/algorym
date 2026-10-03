import { useEffect, useState } from "react";
import type { RunResultPayload } from "@algorym/shared-types";
import type { SessionSocket } from "./use-session-socket";

export interface RoomOutputEntry {
    /** Stable key for React — two identical runs must not collapse. */
    key: string;
    actorParticipantId: string;
    isSelf: boolean;
    result: RunResultPayload;
    receivedAt: number;
}

/** Keep memory bounded in a long interview; the replay uses persisted events. */
const MAX_ENTRIES = 50;

let receivedCount = 0;

/**
 * Collects `run_result` broadcasts so the output panel shows what **everyone** in
 * the room ran, not just the local user.
 *
 * The presser also receives their own result over HTTP via `useRunCode`. This
 * hook deliberately does not merge the two: HTTP is the immediate, guaranteed
 * answer for the person who pressed Run, and this is the room-wide feed. The
 * broadcast for your own run arrives too, which is why the UI de-duplicates by
 * comparing stdout.
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
                    result: message.payload,
                    receivedAt,
                };

                setEntries((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));
            }),
        [subscribe, selfParticipantId]
    );

    return entries;
}
