/**
 * Resolves the origin that serves the API and WebSocket endpoints.
 *
 * In development the client runs on the Vite port (5173) while the API/WebSocket
 * server runs separately (3000), and there is no dev proxy — so the WS URL must
 * be built from VITE_API_URL. In production both are same-origin, so falling
 * back to window.location keeps the default correct with no configuration.
 */
const getApiOrigin = (): string => {
    const configured = import.meta.env.VITE_API_URL?.trim();
    if (configured) return configured.replace(/\/+$/, "");
    return window.location.origin;
};

export const buildWsUrl = (path: string): string => {
    const origin = getApiOrigin();
    const protocol = origin.startsWith("https") ? "wss:" : "ws:";
    const host = origin.replace(/^https?:\/\//, "");
    return `${protocol}//${host}${path}`;
};

/** Absolute browser URL for a live-room link, always on the client origin. */
export const buildLiveRoomUrl = (sessionId: string): string =>
    `${window.location.origin}/live/${sessionId}`;

export const buildInviteUrl = (sessionId: string, accessToken: string): string =>
    `${buildLiveRoomUrl(sessionId)}?token=${encodeURIComponent(accessToken)}`;
