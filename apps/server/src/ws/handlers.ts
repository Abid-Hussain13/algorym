import { WebSocket } from "ws";
import { logSessionEvent } from "../services/session-events.service.js";

export const handleMessage = (ws: WebSocket, sessionId: string, participantId: string | undefined, raw: Buffer): void => {
    let message: Record<string, unknown>;

    try {
        message = JSON.parse(raw.toString());
    } catch {
        ws.send(JSON.stringify({ type: "error", payload: { message: "Invalid JSON" } }));
        return;
    }

    if (!message.type || typeof message.type !== "string") {
        ws.send(JSON.stringify({ type: "error", payload: { message: "Message must have a type field" } }));
        return;
    }

    if (message.type !== "code_snapshot") {
        ws.send(JSON.stringify({ type: "error", payload: { message: `Unknown message type: ${message.type}` } }));
        return;
    }

    const payload = message.payload as { code?: unknown };

    if (typeof payload.code !== "string") {
        ws.send(JSON.stringify({ type: "error", payload: { message: "code_snapshot payload must include a code string" } }));
        return;
    }

    void logSessionEvent(sessionId, participantId ?? null, "code_snapshot", { code: payload.code })
        .catch((err) => console.error("Failed to persist code_snapshot:", err));
};
