import { useEffect } from "react";
import type { WebsocketProvider } from "y-websocket";

/** Derived from the provider so we depend on no extra package. */
type Awareness = WebsocketProvider["awareness"];

/**
 * Warns before someone closes or reloads the room.
 *
 * Browsers only allow a plain `beforeunload` prompt, so the copy cannot be
 * customised — the browser decides the wording. That limitation is also why
 * this is deliberately light: a dialog whose text you do not control is worse
 * than no dialog.
 *
 * It applies to **both** roles while the session is live, because losing an
 * interview to an accidental refresh is expensive for the host too. Once the
 * session ends, leaving is the expected next action, so a prompt then would be
 * nonsense.
 *
 * `FullscreenGuard` already tells the candidate not to leave; this is the
 * browser-level backstop for when that is ignored.
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

/**
 * Publishes "I am currently in another tab" on the awareness channel, so the
 * other side can see it without a new protocol message.
 *
 * **Deliberately passive: it observes and reports, it never blocks.** There is no
 * reliable way to stop someone switching tabs, and a client that fought back —
 * nagging modals, repeated toasts — would read as surveillance and sour the
 * interview. The host gets a quiet indicator and the recording captures the gap.
 *
 * Awareness was the right home rather than a new `WsClientMessage`: it already
 * flows to everyone in the room, it already carries per-user state, and it
 * expires on its own if the tab dies — so an away participant who never returns
 * disappears rather than lingering as a ghost.
 *
 * `visibilitychange` is used rather than `blur`, because `blur` also fires when
 * focus moves to devtools or a sibling window, whereas `visibility` only flips
 * when the document genuinely becomes hidden.
 */
export function useAwaySignal(awareness: Awareness | null, enabled: boolean): void {
    useEffect(() => {
        if (!awareness) return;

        const publish = (away: boolean, since: number | null) => {
            awareness.setLocalStateField("focus", { away, since });
        };

        // Start clean: a reload must not look like a fresh disappearance.
        publish(false, null);

        if (!enabled) return;

        let awaySince: number | null = null;

        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                if (awaySince === null) {
                    awaySince = Date.now();
                    publish(true, awaySince);
                }
            } else if (awaySince !== null) {
                awaySince = null;
                publish(false, null);
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            publish(false, null);
        };
    }, [awareness, enabled]);
}