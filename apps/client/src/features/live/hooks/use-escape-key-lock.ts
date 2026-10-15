import { useEffect } from "react";

/** The Keyboard Lock API is not in TypeScript's DOM lib yet, so only the two . */
interface KeyboardLockCapableNavigator extends Navigator {
    keyboard?: { lock(keys?: string[]): Promise<void>; unlock(): Promise<void> };
}

const keyboardOf = (): KeyboardLockCapableNavigator["keyboard"] =>
    (navigator as KeyboardLockCapableNavigator).keyboard;

/** Asks the browser to stop treating Escape as "exit full screen" while . */
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
