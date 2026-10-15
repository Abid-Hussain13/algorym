/** Stable per-person colour. . */

const PALETTE = [
    "#f4702c", // accent orange (the host's usual colour)
    "#3b82f6", // blue
    "#10b981", // emerald
    "#a855f7", // violet
    "#eab308", // amber
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#84cc16", // lime
] as const;

export const DEFAULT_PARTICIPANT_COLOR = PALETTE[0];

/** djb2-style hash — cheap, stable, and good enough to spread 8 colours. . */
const hash = (value: string): number => {
    let result = 0;
    for (let i = 0; i < value.length; i++) {
        result = (result * 31 + value.charCodeAt(i)) >>> 0;
    }
    return result;
};

export const colorForParticipant = (participantId: string): string =>
    PALETTE[hash(participantId) % PALETTE.length];
