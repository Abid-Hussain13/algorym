import { useCallback, useEffect, useState } from "react";

const isFullscreenElement = (): boolean => {
    if (typeof document === "undefined") return false;
    return document.fullscreenElement !== null;
};

/** Browser Fullscreen API wrapper for the live room. . */
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
