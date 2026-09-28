import jwt from "jsonwebtoken";
import type { IncomingMessage } from "http";
import { URL } from "url";
import type { AuthPayload } from "../types/index.js";
import { parseCookieHeader } from "../utils/parse-cookie.js";

export interface WsConnectionInfo {
    userId?: string;
    email?: string;
    sessionId: string;
    participantId: string;
}

/**
 * The access token is an httpOnly cookie, so browser JavaScript cannot read it to
 * put in the query string. Same-origin WebSocket upgrades do carry the Cookie
 * header, so fall back to it. An explicit `?token=` still wins so scripted
 * clients (and tests) can authenticate without a cookie jar.
 */
export const readWsToken = (request: IncomingMessage): string | null => {
    const url = request.url;
    if (url) {
        const fromQuery = new URL(url, "http://localhost").searchParams.get("token");
        if (fromQuery) return fromQuery;
    }

    return parseCookieHeader(request.headers.cookie).accessToken ?? null;
};

export const extractConnectionInfo = (request: IncomingMessage): WsConnectionInfo | null => {
    const url = request.url;
    if (!url) return null;

    const parsed = new URL(url, "http://localhost");
    const sessionId = parsed.searchParams.get("sessionId");
    const participantId = parsed.searchParams.get("participantId");

    if (!sessionId || !participantId) return null;

    const token = readWsToken(request);

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
