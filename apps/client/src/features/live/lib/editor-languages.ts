/**
 * Language data for the live room — deliberately **free of any CodeMirror
 * import**.
 *
 * The syntax-highlighting extensions live in `editor-language-extensions.ts`.
 * Keeping them apart matters for bundle size: `RunToolbar` and
 * `AllQuestionsPicker` both need `isSupportedLanguage`, and if they reached it
 * through this file they would pull all five language modes into the main chunk
 * and defeat the lazy-loaded editor.
 */

export const DEFAULT_LANGUAGE = "javascript";

/** The five languages the executor accepts (see `runCodeSchema` on the server). */
export const SUPPORTED_LANGUAGES = [
    "javascript",
    "python",
    "java",
    "cpp",
    "go",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const FILENAMES: Record<SupportedLanguage, string> = {
    javascript: "solution.js",
    python: "solution.py",
    java: "Solution.java",
    cpp: "solution.cpp",
    go: "main.go",
};

export const isSupportedLanguage = (
    language: string | null | undefined
): language is SupportedLanguage =>
    !!language && (SUPPORTED_LANGUAGES as readonly string[]).includes(language);

/**
 * The filename a new buffer gets for a language. It is also the key inside the
 * shared `files` Y.Map, so it must be stable — changing it would orphan
 * everyone's existing edits.
 *
 * Returns **null** for an unknown or missing language rather than inventing a
 * `.txt` name. A `solution.txt` tab in the room means the session has no
 * language set, which is a problem the room should surface — not something to
 * paper over with a plausible-looking filename.
 */
export const filenameForLanguage = (language: string | null | undefined): string | null =>
    isSupportedLanguage(language) ? FILENAMES[language as SupportedLanguage] : null;

/** Filename older builds created when the session language was not yet known. */
export const LEGACY_FILENAME = "solution.txt";
