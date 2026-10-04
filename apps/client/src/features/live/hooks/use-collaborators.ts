import { useEffect, useState } from "react";
import type { WebsocketProvider } from "y-websocket";
import type { CollaboratorPresence } from "@algorym/shared-types";
import { colorForParticipant } from "../lib/participant-colors";

/** Derived from the provider so we depend on no extra package. */
type Awareness = WebsocketProvider["awareness"];
type AwarenessState = Map<number, Record<string, unknown>>;

interface AwarenessParticipant {
    participantId: string;
    displayName: string;
    role: "host" | "guest";
}

const isParticipant = (value: unknown): value is AwarenessParticipant => {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Partial<AwarenessParticipant>;
    return typeof candidate.participantId === "string" && typeof candidate.displayName === "string";
};

export interface Collaborator extends CollaboratorPresence {
    role: "host" | "guest";
    isSelf: boolean;
    clientId: number;
    /** True when their document is hidden — in another tab or minimised. */
    isAway: boolean;
    /** When they went away, for the host's benefit. */
    awaySince: number | null;
}

/**
 * Live roster of everyone connected to the room, derived from Yjs awareness.
 *
 * Awareness is the right source here rather than `join`/`leave` events on /ws:
 * it is keyed per client connection, so a tab that dies without a clean close
 * simply expires from the roster instead of leaving a ghost participant.
 */
export function useCollaborators(
    awareness: Awareness | null,
    selfParticipantId: string | undefined,
    isConnected: boolean,
): { collaborators: Collaborator[]; connected: boolean } {
    const [roster, setRoster] = useState<Collaborator[]>([]);

    useEffect(() => {
        if (!awareness) return;

        const read = () => {
            const next: Collaborator[] = [];

            (awareness.getStates() as AwarenessState).forEach((state, clientId) => {
                const participant = state?.participant;
                if (!isParticipant(participant)) return;

                // `state.user` is only present on clients that published the
                // y-codemirror awareness field, so narrow before reading it.
                const userColor = (state?.user as { color?: unknown } | undefined)?.color;
                // Published by `useAwaySignal`.
                const focus = state?.focus as { away?: unknown; since?: unknown } | undefined;
                const isAway = focus?.away === true;
                const awaySince = typeof focus?.since === "number" ? focus.since : null;

                next.push({
                    participantId: participant.participantId,
                    displayName: participant.displayName,
                    role: participant.role,
                    // Falls back to the derived colour so a client that joined
                    // before `user` existed still gets the right avatar tint.
                    color: typeof userColor === "string" ? userColor : colorForParticipant(participant.participantId),
                    isSelf: participant.participantId === selfParticipantId,
                    clientId,
                    isAway,
                    awaySince,
                });
            });

            next.sort((a, b) => {
                if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
                return a.displayName.localeCompare(b.displayName);
            });

            setRoster(next);
        };

        // Awareness is an external system, not derived React state: the roster
        // cannot be computed during render, only read from the provider and
        // pushed into state. The first read seeds it, the listeners keep it live.
        read();

        awareness.on("change", read);
        awareness.on("add", read);
        awareness.on("remove", read);

        return () => {
            awareness.off("change", read);
            awareness.off("add", read);
            awareness.off("remove", read);
        };
    }, [awareness, selfParticipantId]);

    // Before the provider exists there is nobody to show.
    const collaborators = awareness ? roster : [];

    return { collaborators, connected: isConnected };
}
