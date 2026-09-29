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
 * `enter()` must be called from a user gesture — browsers reject it otherwise,
 * so this is never triggered automatically.
 */
export function useFullscreen(target?: React.RefObject<HTMLElement | null>) {
    const [isFullscreen, setIsFullscreen] = useState(isFullscreenElement);

    useEffect(() => {
        const onChange = () => setIsFullscreen(isFullscreenElement());
        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);

    const enter = useCallback(async () => {
        const element = target?.current ?? document.documentElement;
        try {
            await element.requestFullscreen();
        } catch {
            /* rejected (no gesture, or blocked) — the room still works */
        }
    }, [target]);

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
