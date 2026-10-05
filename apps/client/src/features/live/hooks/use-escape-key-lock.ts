import { useEffect } from "react";

/**
 * The Keyboard Lock API is not in TypeScript's DOM lib yet, so only the two
 * members actually used here are declared. Declared locally rather than widening
 * the global `Navigator` so the surface stays tied to this one feature.
 */
interface KeyboardLockCapableNavigator extends Navigator {
    keyboard?: { lock(keys?: string[]): Promise<void>; unlock(): Promise<void> };
}

const keyboardOf = (): KeyboardLockCapableNavigator["keyboard"] =>
    (navigator as KeyboardLockCapableNavigator).keyboard;

/**
 * Asks the browser to stop treating Escape as "exit full screen" while
 * `enabled` is true.
 *
 * Chrome binds Escape to leaving full screen at the **browser** level, below the
 * page, so no `preventDefault` can stop it — the only supported escape hatch is
 * the Keyboard Lock API. Vim depends on Escape (it is the single most-pressed
 * key in the mode), so without this a vim user drops out of full screen every
 * time they go back to normal mode.
 *
 * **Platform caveat, deliberately surfaced rather than hidden:** Chrome only
 * *honours* `keyboard.lock()` on Windows. On macOS and Linux the call exists
 * but is rejected, so Escape keeps exiting full screen there. There is no way
 * around that from the page, so `supportsLocking()` lets the UI say so instead
 * of leaving the user to discover it by accident.
 *
 * A lock is only valid while the document is full screen, so the caller must
 * pass that state; Chrome silently ignores the request otherwise. Every exit
 * path releases it, because a stuck lock would be worse than no lock at all.
 */
export function supportsKeyboardLocking(): boolean {
    return typeof navigator !== "undefined" && !!keyboardOf()?.lock;
}

export function useEscapeKeyLock(enabled: boolean) {
    useEffect(() => {
        if (!enabled || !supportsKeyboardLocking()) return;

        let released = false;

        const release = () => {
            if (released) return;
            released = true;
            keyboardOf()?.unlock().catch(() => {
                /* already unlocked */
            });
        };

        // Rejected whenever the document is not full screen, or on an
        // unsupported platform. Either way the app stays usable.
        keyboardOf()?.lock(["Escape"]).catch(release);

        return release;
    }, [enabled]);
}
