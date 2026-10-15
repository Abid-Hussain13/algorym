import type { IncomingMessage } from "http";
import { URL } from "url";
import { verifyAccessToken } from "../utils/verifyAccessToken.js";
import { parseCookieHeader } from "../utils/parse-cookie.js";

export interface WsConnectionInfo {
    userId?: string;
    email?: string;
    sessionId: string;
    participantId: string;
}

/** The access token is an httpOnly cookie, so browser JavaScript cannot read it to . */
export const readWsToken = (request: IncomingMessage): string | null => {
    const url = request.url;
    if (url) {
        const fromQuery = new URL(url, "http://localhost").searchParams.get("token");
        if (fromQuery) return fromQuery;
    }

    return parseCookieHeader(request.headers.cookie).accessToken ?? null;
};

export const extractConnectionInfo = async (request: IncomingMessage): Promise<WsConnectionInfo | null> => {
    const url = request.url;
    if (!url) return null;

    const parsed = new URL(url, "http://localhost");
    const sessionId = parsed.searchParams.get("sessionId");
    const participantId = parsed.searchParams.get("participantId");

    if (!sessionId || !participantId) return null;

    const token = readWsToken(request);

    if (token) {
        try {
            const decoded = await verifyAccessToken(token);
            return { userId: decoded.id, email: decoded.email, sessionId, participantId };
        } catch {
            return null;
        }
    }

    return { sessionId, participantId };
};
