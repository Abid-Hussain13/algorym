import jwt from "jsonwebtoken";
import type { IncomingMessage } from "http";
import type { AuthPayload } from "../../types/index.js";
import { readWsToken } from "../auth.js";

export interface CollabConnectionInfo {
    sessionId: string;
    participantId: string;
    userId?: string;
}

export const COLLAB_PATH_PREFIX = "/collaboration";

export const parseCollabConnectionInfo = (request: IncomingMessage): CollabConnectionInfo | null => {
    const url = request.url;
    if (!url) return null;

    const parsed = new URL(url, "http://localhost");
    const match = COLLAB_PATH_PREFIX.length > 0 ? parsed.pathname.match(new RegExp(`^${COLLAB_PATH_PREFIX}/([^/]+)`)) : null;
    const sessionId = match?.[1];
    const participantId = parsed.searchParams.get("participantId");

    if (!sessionId || !participantId) return null;

    const token = readWsToken(request);

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
            return { sessionId, participantId, userId: decoded.id };
        } catch {
            return null;
        }
    }

    return { sessionId, participantId };
};
