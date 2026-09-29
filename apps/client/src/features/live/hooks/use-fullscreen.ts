import { useCallback, useEffect, useState } from "react";

const isFullscreenElement = (): boolean => {
    if (typeof document === "undefined") return false;
    return document.fullscreenElement !== null;
};

/**
 * Browser Fullscreen API wrapper for the live room.
 *
 * The route is already chrome-less (h-svh, no dashboard shell), so this is the
 * second half: it also hides the browser's own address bar and tabs, which is
 * what actually deters a candidate from wandering off mid-interview.
 *
 * Always targets `document.documentElement` — the whole page goes full screen,
 * which is what the room wants, and it keeps the hook free of a ref parameter
 * that React Compiler cannot memoize safely.
 *
 * `enter()` must be called from a user gesture — browsers reject it otherwise,
 * so this is never triggered automatically.
 */
export function useFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(isFullscreenElement);

    useEffect(() => {
        const onChange = () => setIsFullscreen(isFullscreenElement());
        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);

    const enter = useCallback(async () => {
        try {
            await document.documentElement.requestFullscreen();
        } catch {
            /* rejected (no gesture, or blocked) — the room still works */
        }
    }, []);

    const exit = useCallback(async () => {
        if (!isFullscreenElement()) return;
        try {
            await document.exitFullscreen();
        } catch {
            /* ignore */
        }
    }, []);

    const toggle = useCallback(async () => {
        if (isFullscreenElement()) await exit();
        else await enter();
    }, [enter, exit]);

    return { isFullscreen, enter, exit, toggle };
}
