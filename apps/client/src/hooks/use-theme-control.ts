import { useCallback, useEffect, useRef } from "react";
import { useAppSelector } from "@/stores/hooks";
import { selectTheme } from "@/stores/theme-slice";
import type { ThemePreference } from "@algorym/shared-types";
import { useTheme } from "./use-theme";
import { useUserPreferences, useUpdatePreferences } from "@/features/user/hooks/use-user";

/** The stored preference, which may say "system" even though the applied theme cannot. */
const PREF_KEY = "algorym-theme-preference";

const readStoredPreference = (): ThemePreference | null => {
    try {
        const raw = localStorage.getItem(PREF_KEY);
        return raw === "light" || raw === "dark" || raw === "system" ? raw : null;
    } catch {
        return null;
    }
};

const systemTheme = (): "light" | "dark" =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

/**
 * **The single theme control for the whole app.**
 *
 * There used to be three theme controls and two competing sources of truth:
 *
 * 1. the navbar toggle and the live-room settings both wrote the Redux slice;
 * 2. the profile preferences page wrote the **server** record and then pushed into Redux.
 *
 * Redux won for rendering, so changing the theme in the room looked correct — but the
 * server record kept the old value, so the preferences page showed a *different* selection
 * than the theme actually in use, and signing in elsewhere restored the stale one. A
 * `system` preference made it worse: Redux only stores `light | dark`, so the moment
 * `system` was resolved to a concrete theme, all trace of "follow the OS" was gone.
 *
 * **The rule now:**
 * - Redux `theme-slice` is the **runtime** source of truth — it alone owns `data-theme`,
 *   which is what every component actually renders against.
 * - This hook is the only place allowed to **write** it, so a change made anywhere lands
 *   everywhere in the same tick.
 * - `preference` (`light | dark | system`) is the **persisted** value, mirrored to the
 *   server for signed-in users and to `localStorage` for everyone.
 * - Changes made through the plain toggle are **synced back** to that persisted preference,
 *   which is what closes the loop that made the preferences page lie.
 */
export function useThemeControl() {
    const { setTheme, toggle } = useTheme();
    const applied = useAppSelector(selectTheme);
    const { data: prefs } = useUserPreferences();
    const updatePrefs = useUpdatePreferences();

    const serverPreference = prefs?.theme ?? null;
    const storedPreference = readStoredPreference();

    // `system` is a property of the *preference*, not of the applied theme, so it has to
    // live outside Redux to survive a toggle. Preference wins when it is the more specific
    // answer: server for a signed-in user, localStorage otherwise.
    const preference: ThemePreference =
        serverPreference ?? storedPreference ?? (applied === "dark" ? "dark" : "light");

    // Set while a change is travelling Redux -> preference, so the sync effect does not
    // treat its own write as an external change and ping-pong back.
    const syncing = useRef(false);

    // One-off adoption: a signed-in user's saved preference should win over whatever
    // happens to be in this browser's storage.
    const adopted = useRef<string | null>(null);
    useEffect(() => {
        if (prefs?.theme == null) return;
        if (adopted.current === prefs.theme) return;
        adopted.current = prefs.theme;
        setTheme(prefs.theme === "system" ? systemTheme() : prefs.theme);
    }, [prefs?.theme, setTheme]);

    // Follow the OS while the preference is "system", so a theme switch at sunset is
    // picked up without a reload.
    useEffect(() => {
        if (preference !== "system" || typeof window === "undefined") return;
        const query = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => setTheme(query.matches ? "dark" : "light");
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    }, [preference, setTheme]);

    // A toggle anywhere in the app writes the persisted preference too, which is what
    // keeps the preferences page honest.
    useEffect(() => {
        if (!syncing.current) return;
        syncing.current = false;
        const next: ThemePreference = applied;
        try {
            localStorage.setItem(PREF_KEY, next);
        } catch {
            /* private mode — the theme still applies for this session */
        }
        if (serverPreference && serverPreference !== next) {
            updatePrefs.mutate({ theme: next });
        }
    }, [applied, serverPreference, updatePrefs]);

    const selectPreference = useCallback(
        (next: ThemePreference) => {
            syncing.current = true;
            try {
                localStorage.setItem(PREF_KEY, next);
            } catch {
                /* ignore */
            }
            if (next === "system") setTheme(systemTheme());
            else setTheme(next);

            // Only the explicit choice is written to the server; the sync effect above
            // handles the "toggled elsewhere" case without duplicating the request.
            if (next !== serverPreference) updatePrefs.mutate({ theme: next });
        },
        [serverPreference, setTheme, updatePrefs]
    );

    return {
        /** What is actually on screen right now. */
        theme: applied,
        /** What the user chose, which may be `system`. */
        preference,
        selectPreference,
        toggle,
    };
}