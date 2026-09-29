import { useCallback, useEffect, useRef, useState } from "react";
import type { WsClientMessage, WsMessage } from "@algorym/shared-types";
import { WsClient } from "@/lib/ws/socket";

type Listener = (message: WsMessage) => void;

export interface SessionSocket {
    /** True while the socket is open and the server has answered us. */
    isConnected: boolean;
    /** Register a handler for every incoming event. Returns an unsubscribe fn. */
    subscribe: (listener: Listener) => () => void;
    /** Fire-and-forget. Silently drops if the socket is not open yet. */
    send: (message: WsClientMessage) => void;
}

/**
 * Binds the `/ws` event socket to React.
 *
 * Deliberately *not* a `useState` of "the last message": two identical
 * `run_result`s in a row would collapse into one, and every consumer would be
 * forced to care about messages it does not handle. Instead each part of the
 * room subscribes to what it needs:
 *
 *     const socket = useSessionSocket(sessionId, participant.id);
 *     useEffect(() => socket.subscribe(msg => {
 *         if (msg.type === 'run_result') setResult(msg.payload);
 *     }), [socket]);
 *
 * The socket is created inside the effect so setup and teardown are symmetric —
 * creating it during render breaks under StrictMode, which mounts, unmounts and
 * remounts in development and would leave a dead socket behind.
 */
export function useSessionSocket(
    sessionId: string,
    participantId: string,
    enabled = true
): SessionSocket {
    const [isConnected, setIsConnected] = useState(false);
    const listenersRef = useRef<Set<Listener>>(new Set());
    const clientRef = useRef<WsClient | null>(null);

    useEffect(() => {
        if (!enabled || !sessionId || !participantId) return;

        const client = new WsClient({
            path: "/ws",
            params: { sessionId, participantId },
            onMessage: (message) => {
                for (const listener of listenersRef.current) listener(message);
            },
            onOpen: () => setIsConnected(true),
            onClose: () => setIsConnected(false),
        });

        clientRef.current = client;
        client.connect();

        return () => {
            client.close();
            if (clientRef.current === client) clientRef.current = null;
            setIsConnected(false);
        };
    }, [sessionId, participantId, enabled]);

    const subscribe = useCallback((listener: Listener) => {
        listenersRef.current.add(listener);
        return () => {
            listenersRef.current.delete(listener);
        };
    }, []);

    const send = useCallback((message: WsClientMessage) => {
        clientRef.current?.send(message);
    }, []);

    return { isConnected, subscribe, send };
}
