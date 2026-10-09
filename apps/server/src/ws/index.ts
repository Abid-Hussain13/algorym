import { Server as HttpServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupWSConnection } from "@y/websocket-server/utils";
import { Duplex } from "stream";
import { extractConnectionInfo } from "./auth.js";
import { COLLAB_PATH_PREFIX, parseCollabConnectionInfo } from "./collab/auth.js";
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

/**
 * Held at module scope because `initializeWebSocketServer` creates the server
 * internally, so a caller that wants to shut it down later has no other handle
 * on it. Only ever one process, one server.
 */
let activeServer: WebSocketServer | null = null;

/**
 * Close every WebSocket, telling clients why first.
 *
 * Closing the server alone is not enough: `wss.close()` only stops accepting new
 * connections and leaves existing ones hanging, which reads to the client as a
 * network fault and makes it sit out its whole reconnect backoff. Sending a
 * proper close frame with a reason lets the browser reconnect immediately.
 *
 * `1001` is "going away", the standard code for a server restart.
 */
export const shutdownWebSocketServer = (code = 1001, reason = "Server restarting"): void => {
    const wss = activeServer;
    if (!wss) return;

    for (const client of wss.clients) {
        try {
            client.close(code, reason);
        } catch {
            // Already closing or destroyed; nothing to do.
        }
    }
    wss.close();
    activeServer = null;
};

export const initializeWebSocketServer = (server: HttpServer): WebSocketServer => {
    const wss = new WebSocketServer({ noServer: true });
    activeServer = wss;

    server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
        const { pathname } = new URL(request.url ?? "/", "http://localhost");
        const collab = isCollabPath(pathname);

        if (!collab && pathname !== EVENTS_PATH) return;

        const info = collab
            ? parseCollabConnectionInfo(request)
            : extractConnectionInfo(request);

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

        if (isCollabPath(pathname)) {
            const collabInfo = parseCollabConnectionInfo(req);

            if (!collabInfo) {
                ws.close(4001, "Invalid connection parameters");
                return;
            }

            ws.sessionId = collabInfo.sessionId;
            ws.participantId = collabInfo.participantId;

            setupWSConnection(ws, req, { docName: collabInfo.sessionId });
            return;
        }

        const info = extractConnectionInfo(req);

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
