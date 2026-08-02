import jwt from "jsonwebtoken";
import type { AuthPayload } from "../types/index.js";

export interface CollabConnectionInfo {
    sessionId: string;
    participantId: string;
    userId?: string;
}

export const COLLAB_PATH_PREFIX = "/collaboration";

export const parseCollabConnectionInfo = (url: string | undefined): CollabConnectionInfo | null => {
    if (!url) return null;

    const parsed = new URL(url, "http://localhost");
    const match = COLLAB_PATH_PREFIX.length > 0 ? parsed.pathname.match(new RegExp(`^${COLLAB_PATH_PREFIX}/([^/]+)`)) : null;
    const sessionId = match?.[1];
    const participantId = parsed.searchParams.get("participantId");
    const token = parsed.searchParams.get("token");

    if (!sessionId || !participantId) return null;

    let userId: string | undefined;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
            userId = decoded.id;
        } catch {
            return null;
        }
    }

    return { sessionId, participantId, userId };
};
