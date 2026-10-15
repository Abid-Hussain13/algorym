import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { buildWsUrl } from "@/lib/session-urls";
import { colorForParticipant } from "../lib/participant-colors";
import type { LocalParticipant } from "../lib/participant-store";

export const FILES_MAP_KEY = "files";

export interface Collaboration {
    doc: Y.Doc;
    provider: WebsocketProvider;
    files: Y.Map<Y.Text>;
    isConnected: boolean;
    /** First sync with the server doc has completed — the files map is authoritative. . */
    hasSynced: boolean;
}

/** Owns the shared Yjs document for one session room. . */
export function useCollaboration(sessionId: string, participant: LocalParticipant): Collaboration | null {
    const { id: participantId, displayName, role } = participant;
    const [collaboration, setCollaboration] = useState<Collaboration | null>(null);

    useEffect(() => {
        const doc = new Y.Doc();
        const provider = new WebsocketProvider(buildWsUrl("/collaboration"), sessionId, doc, {
            params: { participantId },
        });
        const files = doc.getMap<Y.Text>(FILES_MAP_KEY);

        // two awareness fields: our roster, and what y-codemirror expects.
        provider.awareness.setLocalStateField("participant", { participantId, displayName, role });
        provider.awareness.setLocalStateField("user", {
            name: displayName,
            color: colorForParticipant(participantId),
        });

        let isConnected = provider.wsconnected;
        let hasSynced = provider.synced;

        const handleStatus = ({ status }: { status: string }) => {
            isConnected = status === "connected";
            setCollaboration((prev) => (prev ? { ...prev, isConnected } : prev));
        };

        const handleSync = (state: boolean) => {
            hasSynced = state;
            setCollaboration((prev) => (prev ? { ...prev, hasSynced: state } : prev));
        };

        provider.on("status", handleStatus);
        provider.on("sync", handleSync);
        // The Y.Doc and WebsocketProvider are external objects that cannot be
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCollaboration({ doc, provider, files, isConnected, hasSynced });

        return () => {
            provider.off("status", handleStatus);
            provider.off("sync", handleSync);
            provider.destroy();
            doc.destroy();
            setCollaboration(null);
        };
    }, [sessionId, participantId, displayName, role]);

    return collaboration;
}
