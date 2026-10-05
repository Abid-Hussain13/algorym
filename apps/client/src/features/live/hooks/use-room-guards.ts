import { useEffect } from "react";

/**
 * Warns before someone closes or reloads the room.
 *
 * Browsers only allow a plain `beforeunload` prompt, so the copy cannot be
 * customised — the browser decides the wording. That limitation is also why this
 * is kept light rather than replaced with a custom dialog we would have to style
 * blind.
 *
 * It applies to **both** roles while the session is live, because losing an
 * interview to an accidental refresh is expensive for the host too. Once the
 * session ends, leaving is the expected next action, so a prompt then would be
 * nonsense.
 *
 * The full screen and tab-away reporting deliberately live in
 * `useFullscreenGuard`, which is the **single writer** of the awareness `focus`
 * field. Two writers of one field silently overwrite each other — see the note
 * there.
 */
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
