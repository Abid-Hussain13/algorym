import { useSyncExternalStore } from "react";

/**
 * Per-user editor preferences: keymap mode and font size.
 *
 * These are stored in `localStorage`, which is what makes them **per user** —
 * every browser profile keeps its own settings, and they survive reloads
 * without any account round-trip. That matches how `algorym-theme` already
 * behaves.
 *
 * A module-level store plus `useSyncExternalStore` rather than `useState`,
 * because two unrelated parts of the room need to agree on the current value
 * (the editor itself and the settings panel that edits it). `useState` would
 * give each of them a private copy, and the settings panel would happily show
 * "Normal" while the editor silently stayed in vim.
 */

export type EditorMode = "normal" | "vim";

export interface EditorPreferences {
    mode: EditorMode;
    fontSize: number;
}

/** Offered in the settings panel. 13 is the default that matches the theme. */
export const FONT_SIZES = [11, 12, 13, 14, 16, 18, 20] as const;

const DEFAULTS: EditorPreferences = { mode: "normal", fontSize: 13 };
const STORAGE_KEY = "algorym-editor-prefs";

function coerce(raw: string | null): EditorPreferences {
    if (!raw) return DEFAULTS;
    try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return DEFAULTS;
        const candidate = parsed as Partial<EditorPreferences>;

        return {
            mode: candidate.mode === "vim" ? "vim" : "normal",
            fontSize: (FONT_SIZES as readonly number[]).includes(candidate.fontSize as number)
                ? (candidate.fontSize as number)
                : DEFAULTS.fontSize,
        };
    } catch {
        // A hand-edited or half-written value must never crash the editor.
        return DEFAULTS;
    }
}

let snapshot: EditorPreferences = coerce(
    typeof localStorage === "undefined" ? null : localStorage.getItem(STORAGE_KEY),
);

const listeners = new Set<() => void>();

function commit(next: EditorPreferences) {
    snapshot = next;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Private mode / quota. The session still works, it just won't persist.
    }
    for (const listener of listeners) listener();
}

export function setEditorMode(mode: EditorMode) {
    if (snapshot.mode === mode) return;
    commit({ ...snapshot, mode });
}

export function setEditorFontSize(fontSize: number) {
    if (snapshot.fontSize === fontSize) return;
    commit({ ...snapshot, fontSize });
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function getSnapshot() {
    return snapshot;
}

export function useEditorPreferences() {
    const prefs = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    return {
        ...prefs,
        setMode: setEditorMode,
        setFontSize: setEditorFontSize,
    };
}
