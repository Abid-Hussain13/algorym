import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";
import {
    LEGACY_FILENAME,
    filenameForLanguage,
    isSupportedLanguage,
} from "../lib/editor-languages";

interface EditorFilesState {
    /** Every filename in the shared map, alphabetically. */
    fileNames: string[];
    activeName: string | null;
    /** The shared text for the active tab, or null before the map exists. */
    activeText: Y.Text | null;
    setActiveName: (name: string) => void;
    addFile: () => void;
    closeFile: (name: string) => void;
}

/**
 * Owns the shared `files` Y.Map: which buffers exist, which one is on screen,
 * and the starter code every participant sees.
 *
 * The map is keyed by filename, so "a tab" is really "a key in a shared
 * dictionary". Closing a tab deletes the key — which deletes the buffer for
 * **everyone**, not just locally. That is intended: the room shares one set of
 * files.
 *
 * `isReady` gates seeding. The question arrives over HTTP *after* the room
 * mounts, so seeding on first render would create an empty buffer and then
 * refuse to fill it — the map would already be non-empty. A question with no
 * starter code at all is still seeded, just empty, which is why this waits for
 * the load to settle rather than for a non-null `starterCode`.
 *
 * Seeding happens only when the map is completely empty, so switching question
 * never wipes work in progress — destroying a candidate's solution because the
 * interviewer moved on would be far worse than carrying an old file forward. Use
 * `closeFile` to start a fresh buffer.
 */
export function useEditorFiles(
    files: Y.Map<Y.Text> | null,
    starterCode: string | null | undefined,
    language: string | null | undefined,
    isReady: boolean
): EditorFilesState {
    const [fileNames, setFileNames] = useState<string[]>([]);
    const [activeName, setActiveNameState] = useState<string | null>(null);

    // Track the map's keys. Fires when anyone adds or closes a file, in any tab.
    useEffect(() => {
        if (!files) return;

        const sync = () => {
            // Deliberately NOT sorted. A Y.Map preserves insertion order, which is
            // what an editor tab strip needs: a newly added file appears to the
            // right of the existing ones. Sorting alphabetically was actively
            // wrong here, because "solution-2.js" sorts before "solution.js"
            // ('-' < '.') and the new tab jumped to the far left.
            const names = Array.from(files.keys());
            setFileNames(names);
            setActiveNameState((prev) => (prev && files.has(prev) ? prev : names[0] ?? null));
        };

        sync();
        files.observe(sync);

        return () => files.unobserve(sync);
    }, [files]);

    // Seed the first buffer, and heal a legacy one.
    //
    // Seeding is gated on a *known* language, not just a settled query. An older
    // revision seeded as soon as the map was empty, which for a session with no
    // language produced a `solution.txt` tab — and because the map was then
    // non-empty it could never be corrected. `LEGACY_FILENAME` renames that tab
    // so rooms created before this fix recover without being recreated.
    //
    // Both clients may race here; that is safe because Yjs resolves the duplicate
    // `set` to one value and both write the same starter code anyway.
    useEffect(() => {
        if (!files || !isReady || !isSupportedLanguage(language)) return;

        const expected = filenameForLanguage(language);
        if (!expected) return;

        const names = Array.from(files.keys());

        if (names.length === 0) {
            const text = new Y.Text();
            if (starterCode) text.insert(0, starterCode);
            files.set(expected, text);
            return;
        }

        if (names.length === 1 && names[0] === LEGACY_FILENAME) {
            const existing = files.get(LEGACY_FILENAME);
            if (existing) {
                files.delete(LEGACY_FILENAME);
                files.set(expected, existing);
            }
        }
    }, [files, isReady, language, starterCode]);

    const setActiveName = useCallback((name: string) => setActiveNameState(name), []);

    const addFile = useCallback(() => {
        const base = filenameForLanguage(language);
        if (!files || !base) return;

        let name = base;
        let counter = 2;
        while (files.has(name)) {
            name = base.replace(/(\.[^.]+)$/, `-${counter}$1`);
            counter += 1;
        }

        const text = new Y.Text();
        files.set(name, text);
        setActiveNameState(name);
    }, [files, language]);

    const closeFile = useCallback(
        (name: string) => {
            if (!files) return;

            files.delete(name);
            setActiveNameState((prev) => (prev === name ? null : prev));
        },
        [files]
    );

    return {
        fileNames,
        activeName,
        activeText: activeName ? files?.get(activeName) ?? null : null,
        setActiveName,
        addFile,
        closeFile,
    };
}
