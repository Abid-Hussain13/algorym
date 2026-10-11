import type { IncomingMessage } from "http";
import { verifyAccessToken } from "../../utils/verifyAccessToken.js";
import { readWsToken } from "../auth.js";

export interface CollabConnectionInfo {
    sessionId: string;
    participantId: string;
    userId?: string;
}

export const COLLAB_PATH_PREFIX = "/collaboration";

export const parseCollabConnectionInfo = async (request: IncomingMessage): Promise<CollabConnectionInfo | null> => {
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
            const decoded = await verifyAccessToken(token);
            return { sessionId, participantId, userId: decoded.id };
        } catch {
            return null;
        }
    }

    return { sessionId, participantId };
};
