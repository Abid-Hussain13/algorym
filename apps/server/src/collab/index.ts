import type { IncomingMessage, Server as HttpServer } from "http";
import type { Duplex } from "stream";
import { WebSocketServer } from "ws";
import { setupWSConnection } from "@y/websocket-server/utils";
import { COLLAB_PATH_PREFIX, parseCollabConnectionInfo, verifyParticipant } from "./auth.js";

export const initializeCollabServer = (server: HttpServer): void => {
    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
        const parsed = new URL(request.url ?? "/", "http://localhost");

        if (!parsed.pathname.startsWith(COLLAB_PATH_PREFIX)) return;

        const info = parseCollabConnectionInfo(request.url);

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

                wss.handleUpgrade(request, socket, head, (conn) => {
                    wss.emit("connection", conn, request);
                });
            })
            .catch(() => {
                socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
                socket.destroy();
            });
    });

    wss.on("connection", (conn, req) => {
        const info = parseCollabConnectionInfo(req.url);

        if (!info) {
            conn.close(4001, "Invalid connection parameters");
            return;
        }

        setupWSConnection(conn, req, { docName: info.sessionId });
    });
};
