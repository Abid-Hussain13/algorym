import { useEffect, useState } from "react";
import type { WebsocketProvider } from "y-websocket";
import type { CollaboratorPresence } from "@algorym/shared-types";

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
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

    useEffect(() => {
        if (!awareness) {
            setCollaborators([]);
            return;
        }

        const read = () => {
            const next: Collaborator[] = [];

            (awareness.getStates() as AwarenessState).forEach((state, clientId) => {
                const participant = state?.participant;
                if (!isParticipant(participant)) return;

                next.push({
                    participantId: participant.participantId,
                    displayName: participant.displayName,
                    role: participant.role,
                    color: "#f4702c",
                    isSelf: participant.participantId === selfParticipantId,
                    clientId,
                });
            });

            next.sort((a, b) => {
                if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
                return a.displayName.localeCompare(b.displayName);
            });

            setCollaborators(next);
        };

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

    return { collaborators, connected: isConnected };
}
