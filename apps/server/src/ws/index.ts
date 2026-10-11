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
    isAlive?: boolean;
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
let heartbeatTimer: NodeJS.Timeout | null = null;

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
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
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

/**
 * Ping every client periodically and terminate the ones that do not pong.
 *
 * Without this, half-open connections (NAT timeouts, sleeping laptops,
 * network drops) linger on the server forever, so the room believes the
 * participant is still present.
 */
const startHeartbeat = (wss: WebSocketServer): void => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);

    heartbeatTimer = setInterval(() => {
        for (const client of wss.clients) {
            const ws = client as WsConnection;
            if (ws.isAlive === false) {
                ws.terminate();
                continue;
            }
            ws.isAlive = false;
            ws.ping();
        }
    }, 30_000);

    heartbeatTimer.unref?.();
};

export const initializeWebSocketServer = (server: HttpServer): WebSocketServer => {
    const wss = new WebSocketServer({ noServer: true });
    activeServer = wss;
    startHeartbeat(wss);

    server.on("upgrade", async (request: IncomingMessage, socket: Duplex, head: Buffer) => {
        const { pathname } = new URL(request.url ?? "/", "http://localhost");
        const collab = isCollabPath(pathname);

        if (!collab && pathname !== EVENTS_PATH) return;

        try {
            const info = collab
                ? await parseCollabConnectionInfo(request)
                : await extractConnectionInfo(request);

            if (!info) {
                rejectUpgrade(socket, 401, "Unauthorized");
                return;
            }

            const isVerified = await verifyParticipant(info);
            if (!isVerified) {
                rejectUpgrade(socket, 401, "Unauthorized");
                return;
            }

            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit("connection", ws, request);
            });
        } catch {
            rejectUpgrade(socket, 500, "Internal Server Error");
        }
    });

    wss.on("connection", (ws: WsConnection, req) => {
        ws.isAlive = true;
        ws.on("pong", () => {
            ws.isAlive = true;
        });

        const { pathname } = new URL(req.url ?? "/", "http://localhost");

        if (isCollabPath(pathname)) {
            parseCollabConnectionInfo(req)
                .then((collabInfo) => {
                    if (!collabInfo) {
                        ws.close(4001, "Invalid connection parameters");
                        return;
                    }

                    ws.sessionId = collabInfo.sessionId;
                    ws.participantId = collabInfo.participantId;

                    setupWSConnection(ws, req, { docName: collabInfo.sessionId });
                })
                .catch(() => {
                    ws.close(4001, "Invalid connection parameters");
                });
            return;
        }

        extractConnectionInfo(req)
            .then((info) => {
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
            })
            .catch(() => {
                ws.close(4001, "Invalid connection parameters");
            });
    });

    return wss;
};
