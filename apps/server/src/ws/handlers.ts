import { WebSocket } from "ws";
import { broadcast } from "./connectionManager.js";

export const handleMessage = (ws: WebSocket, sessionId: string, raw: Buffer): void => {
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

    const validTypes = [
        "code_snapshot", "run_result", "highlight",
        "comment", "question_change", "join", "leave",
        "session_started", "session_completed", "session_cancelled",
    ];

    if (!validTypes.includes(message.type)) {
        ws.send(JSON.stringify({ type: "error", payload: { message: `Unknown message type: ${message.type}` } }));
        return;
    }

    broadcast(sessionId, message, ws);
};
