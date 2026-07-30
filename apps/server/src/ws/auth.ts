import jwt from "jsonwebtoken";
import { URL } from "url";
import type { AuthPayload } from "../types/index.js";

export interface WsConnectionInfo {
    userId?: string;
    email?: string;
    sessionId: string;
    participantId: string;
}

export const extractConnectionInfo = (url: string | undefined): WsConnectionInfo | null => {
    if (!url) return null;

    const parsed = new URL(url, "http://localhost");
    const token = parsed.searchParams.get("token");
    const sessionId = parsed.searchParams.get("sessionId");
    const participantId = parsed.searchParams.get("participantId");

    if (!sessionId || !participantId) return null;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
            return { userId: decoded.id, email: decoded.email, sessionId, participantId };
        } catch {
            return null;
        }
    }

    return { sessionId, participantId };
};
