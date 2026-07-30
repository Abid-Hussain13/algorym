import { WebSocket } from "ws";

const rooms = new Map<string, Set<WebSocket>>();

export const joinRoom = (ws: WebSocket, sessionId: string): void => {
    if (!rooms.has(sessionId)) {
        rooms.set(sessionId, new Set());
    }
    rooms.get(sessionId)!.add(ws);
};

export const leaveRoom = (ws: WebSocket, sessionId: string): void => {
    const room = rooms.get(sessionId);
    if (!room) return;

    room.delete(ws);

    if (room.size === 0) {
        rooms.delete(sessionId);
    }
};

export const broadcast = (sessionId: string, message: object, exclude?: WebSocket): void => {
    const room = rooms.get(sessionId);
    if (!room) return;

    const data = JSON.stringify(message);

    for (const client of room) {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    }
};

export const getRoomSize = (sessionId: string): number => {
    return rooms.get(sessionId)?.size ?? 0;
};
