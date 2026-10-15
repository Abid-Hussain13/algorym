import { useEffect } from "react";

/** Warns before someone closes or reloads the room. . */
export function useUnloadGuard(enabled: boolean): void {
    useEffect(() => {
        if (!enabled) return;

        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            // Legacy assignment still triggers the prompt in every browser.
            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [enabled]);
}
