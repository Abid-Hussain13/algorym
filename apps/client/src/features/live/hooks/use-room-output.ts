import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { RunResultPayload } from "@algorym/shared-types";
import { sessionsApi } from "@/lib/api";
import type { SessionSocket } from "./use-session-socket";

export interface RoomOutputEntry {
    /** Stable key for React — two identical runs must not collapse. */
    key: string;
    actorParticipantId: string;
    /** From the event log, so runs of participants who already left stay named. */
    actorName?: string;
    isSelf: boolean;
    /** Echo of the HTTP `runId`, so the presser's local card can be dropped. */
    runId?: string;
    /** Persisted event id — dedupes the history fetch against the live feed. */
    eventId?: string;
    result: RunResultPayload;
    receivedAt: number;
}

/** Keep memory bounded in a long interview; the replay uses persisted events. */
const MAX_ENTRIES = 50;

let receivedCount = 0;

/**
 * Collects the room's runs from two sources into one chronological feed:
 *
 * - **History**: `GET /:id/events?type=run_result` — everything that happened
 *   *before* we joined (live WS broadcasts are fire-and-forget, so a late
 *   joiner would otherwise start with an empty panel).
 * - **Live**: `run_result` broadcasts as they happen.
 *
 * The server echoes the persisted `eventId` (and the client `runId`) on every
 * broadcast, so a run that lands on both channels is stored once, whichever
 * arrives first. Entries append oldest → newest.
 */
export function useRoomOutput(
    socket: SessionSocket,
    selfParticipantId: string | undefined,
    sessionId: string
): RoomOutputEntry[] {
    const [entries, setEntries] = useState<RoomOutputEntry[]>([]);
    const seenIdsRef = useRef<Set<string>>(new Set());
    const seenRunIdsRef = useRef<Set<string>>(new Set());

    // `subscribe` is a stable useCallback; depending on the `socket` object
    // instead would re-subscribe on every render of the room.
    const { subscribe } = socket;

    const { data: history } = useQuery({
        queryKey: ["room-run-history", sessionId, selfParticipantId],
        queryFn: () =>
            sessionsApi
                .events(sessionId, { type: "run_result", participantId: selfParticipantId })
                .then((data) => data.sessionEvents),
        enabled: Boolean(sessionId && selfParticipantId),
        staleTime: Infinity,
        retry: false,
    });

    // History is by definition older than anything received live, so it is
    // spliced in front of the current entries — but only the entries neither
    // channel has already delivered.
    useEffect(() => {
        if (!history) return;

        const fresh: RoomOutputEntry[] = [];
        for (const event of history) {
            if (event.event_type !== "run_result") continue;
            const payload = event.payload as Record<string, unknown>;
            if (typeof payload.status !== "string") continue;

            const eventId = event.id;
            const runId = typeof payload.runId === "string" ? payload.runId : undefined;
            if (eventId && seenIdsRef.current.has(eventId)) continue;
            if (runId && seenRunIdsRef.current.has(runId)) continue;
            if (eventId) seenIdsRef.current.add(eventId);
            if (runId) seenRunIdsRef.current.add(runId);

            fresh.push({
                key: `evt-${eventId}`,
                actorParticipantId: event.actor?.id ?? "",
                actorName: event.actor?.display_name ?? undefined,
                isSelf: (event.actor?.id ?? "") === selfParticipantId,
                runId,
                eventId,
                result: payload as unknown as RunResultPayload,
                receivedAt: Date.parse(event.created_at) || 0,
            });
        }

        if (fresh.length) {
            // Query data is an external system; splicing it into the feed is
            // exactly what this effect exists to do.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEntries((prev) => [...fresh, ...prev].slice(-MAX_ENTRIES));
        }
    }, [history, selfParticipantId]);

    useEffect(
        () =>
            subscribe((message) => {
                if (message.type !== "run_result") return;

                if (message.eventId && seenIdsRef.current.has(message.eventId)) return;
                if (message.runId && seenRunIdsRef.current.has(message.runId)) return;
                if (message.eventId) seenIdsRef.current.add(message.eventId);
                if (message.runId) seenRunIdsRef.current.add(message.runId);

                // Two runs in the same millisecond must not share a React key,
                // so a monotonic counter is mixed into the id.
                receivedCount += 1;
                const receivedAt = Date.now();

                const entry: RoomOutputEntry = {
                    key: `${message.actorParticipantId}-${receivedAt}-${receivedCount}`,
                    actorParticipantId: message.actorParticipantId,
                    isSelf: message.actorParticipantId === selfParticipantId,
                    runId: message.runId,
                    eventId: message.eventId,
                    result: message.payload,
                    receivedAt,
                };

                setEntries((prev) => [...prev, entry].slice(-MAX_ENTRIES));
            }),
        [subscribe, selfParticipantId]
    );

    return entries;
}
