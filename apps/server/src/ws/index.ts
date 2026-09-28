import { Server as HttpServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupWSConnection } from "@y/websocket-server/utils";
import { Duplex } from "stream";
import { extractConnectionInfo } from "./auth.js";
import { COLLAB_PATH_PREFIX, parseCollabConnectionInfo } from "../collab/auth.js";
import { joinRoom, leaveRoom, broadcast } from "./connectionManager.js";
import { handleMessage } from "./handlers.js";
import { verifyParticipant } from "../utils/verifyParticipant.js";

const EVENTS_PATH = "/ws";

interface WsConnection extends WebSocket {
    sessionId?: string;
    participantId?: string;
}

const isCollabPath = (pathname: string): boolean => pathname.startsWith(COLLAB_PATH_PREFIX);

const rejectUpgrade = (socket: Duplex, status: number, reason: string): void => {
    socket.write(`HTTP/1.1 ${status} ${reason}\r\n\r\n`);
    socket.destroy();
};

export const initializeWebSocketServer = (server: HttpServer): WebSocketServer => {
    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
        const { pathname } = new URL(request.url ?? "/", "http://localhost");
        const collab = isCollabPath(pathname);

        if (!collab && pathname !== EVENTS_PATH) return;

        const info = collab
            ? parseCollabConnectionInfo(request.url)
            : extractConnectionInfo(request.url);

        if (!info) {
            rejectUpgrade(socket, 401, "Unauthorized");
            return;
        }

        verifyParticipant(info)
            .then((isVerified) => {
                if (!isVerified) {
                    rejectUpgrade(socket, 401, "Unauthorized");
                    return;
                }

                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit("connection", ws, request);
                });
            })
            .catch(() => {
                rejectUpgrade(socket, 500, "Internal Server Error");
            });
    });

    wss.on("connection", (ws: WsConnection, req) => {
        const { pathname } = new URL(req.url ?? "/", "http://localhost");

        // Collaboration sockets speak the binary Yjs sync protocol. They are
        // deliberately NOT added to the events room: that room broadcasts JSON
        // WsMessage frames, which would corrupt the CRDT stream.
        if (isCollabPath(pathname)) {
            const collabInfo = parseCollabConnectionInfo(req.url);

            if (!collabInfo) {
                ws.close(4001, "Invalid connection parameters");
                return;
            }

            ws.sessionId = collabInfo.sessionId;
            ws.participantId = collabInfo.participantId;

            setupWSConnection(ws, req, { docName: collabInfo.sessionId });
            return;
        }

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
