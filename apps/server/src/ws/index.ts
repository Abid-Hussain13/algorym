import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { extractConnectionInfo } from "./auth.js";
import { joinRoom, leaveRoom, broadcast } from "./connectionManager.js";
import { handleMessage } from "./handlers.js";

interface WsConnection extends WebSocket {
    sessionId?: string;
    participantId?: string;
}

export const initializeWebSocketServer = (server: HttpServer): WebSocketServer => {
    const wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", (ws: WsConnection, req) => {
        const info = extractConnectionInfo(req.url);

        if (!info) {
            ws.close(4001, "Invalid connection parameters");
            return;
        }

        ws.sessionId = info.sessionId;
        ws.participantId = info.participantId;

        joinRoom(ws, info.sessionId);

        broadcast(info.sessionId, { type: "join", payload: {} }, ws);

        ws.on("message", (data: Buffer) => {
            handleMessage(ws, info.sessionId, data);
        });

        ws.on("close", () => {
            leaveRoom(ws, info.sessionId);
            broadcast(info.sessionId, { type: "leave", payload: {} });
        });

        ws.on("error", () => {
            leaveRoom(ws, info.sessionId);
        });
    });

    return wss;
};
