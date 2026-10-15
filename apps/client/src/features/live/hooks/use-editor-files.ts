import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";
import {
    LEGACY_FILENAME,
    filenameForLanguage,
    isSupportedLanguage,
} from "../lib/editor-languages";

interface EditorFilesState {
    /** Every filename in the shared map, alphabetically. . */
    fileNames: string[];
    activeName: string | null;
    /** The shared text for the active tab, or null before the map exists. . */
    activeText: Y.Text | null;
    setActiveName: (name: string) => void;
    addFile: () => void;
    closeFile: (name: string) => void;
}

/** Owns the shared `files` Y.Map: which buffers exist, which one is on screen, . */
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
            // Deliberately NOT sorted.
            const names = Array.from(files.keys());
            setFileNames(names);
            setActiveNameState((prev) => (prev && files.has(prev) ? prev : names[0] ?? null));
        };

        sync();
        files.observe(sync);

        return () => files.unobserve(sync);
    }, [files]);

    // Seed the first buffer, and heal a legacy one.
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
