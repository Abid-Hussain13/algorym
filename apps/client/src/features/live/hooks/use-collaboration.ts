import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { buildWsUrl } from "@/lib/session-urls";
import type { LocalParticipant } from "../lib/participant-store";

export const FILES_MAP_KEY = "files";

export interface Collaboration {
    doc: Y.Doc;
    provider: WebsocketProvider;
    files: Y.Map<Y.Text>;
    isConnected: boolean;
}

/**
 * Owns the shared Yjs document for one session room.
 *
 * `files` is a Y.Map<Y.Text> keyed by filename, so each editor tab is its own
 * collaboratively-synced buffer and tabs never clobber each other.
 *
 * Awareness rides on the same socket: every client publishes its own participant
 * record and `provider.awareness.getStates()` is the live roster. It also means
 * remote cursors come for free once CodeMirror is bound in a later phase.
 *
 * The provider is created *inside* the effect so setup and teardown are
 * symmetric. Creating it during render (memo + ref) breaks under StrictMode:
 * the dev-only cleanup destroys the provider, the memo does not re-run, and the
 * second mount would reuse a dead socket.
 */
export function useCollaboration(sessionId: string, participant: LocalParticipant): Collaboration | null {
    const { id: participantId, displayName, role } = participant;
    const [collaboration, setCollaboration] = useState<Collaboration | null>(null);

    useEffect(() => {
        const doc = new Y.Doc();
        const provider = new WebsocketProvider(buildWsUrl("/collaboration"), sessionId, doc, {
            params: { participantId },
        });
        const files = doc.getMap<Y.Text>(FILES_MAP_KEY);

        provider.awareness.setLocalStateField("participant", { participantId, displayName, role });

        let isConnected = provider.wsconnected;

        const handleStatus = ({ status }: { status: string }) => {
            isConnected = status === "connected";
            setCollaboration((prev) => (prev ? { ...prev, isConnected } : prev));
        };

        provider.on("status", handleStatus);
        setCollaboration({ doc, provider, files, isConnected });

        return () => {
            provider.off("status", handleStatus);
            provider.destroy();
            doc.destroy();
            setCollaboration(null);
        };
    }, [sessionId, participantId, displayName, role]);

    return collaboration;
}
