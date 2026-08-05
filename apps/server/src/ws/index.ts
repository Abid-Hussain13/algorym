import { Server as HttpServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { extractConnectionInfo } from "./auth.js";
import { joinRoom, leaveRoom, broadcast } from "./connectionManager.js";
import { handleMessage } from "./handlers.js";
import { verifyParticipant } from "../utils/verifyParticipant.js";
import { Duplex } from "stream";

interface WsConnection extends WebSocket {
    sessionId?: string;
    participantId?: string;
}

export const initializeWebSocketServer = (server: HttpServer): WebSocketServer => {
    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
        const { pathname } = new URL(request.url ?? "/", "http://localhost");

        if (pathname !== "/ws") return;

        const info = extractConnectionInfo(request.url);

        if (!info) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }

        verifyParticipant(info)
            .then((isVerified) => {
                if (!isVerified) {
                    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                    socket.destroy();
                    return;
                }

                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit("connection", ws, request);
                });
            })
            .catch(() => {
                socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
                socket.destroy();
            });
    });

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
            handleMessage(ws, info.sessionId, info.participantId, data);
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
