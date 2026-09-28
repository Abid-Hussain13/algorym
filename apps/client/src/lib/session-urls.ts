/**
 * Live-room links are built from the current origin so the same code works on
 * localhost, a preview deploy, and production without any environment variable.
 */

const liveRoomPath = (sessionId: string) => `/live/${sessionId}`;

export const buildLiveRoomUrl = (sessionId: string): string =>
    `${window.location.origin}${liveRoomPath(sessionId)}`;

/** Shareable invite: a guest pastes this into their browser to join. */
export const buildInviteUrl = (sessionId: string, accessToken: string): string =>
    `${buildLiveRoomUrl(sessionId)}?token=${encodeURIComponent(accessToken)}`;
