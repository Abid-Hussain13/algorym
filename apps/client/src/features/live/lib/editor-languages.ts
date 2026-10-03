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

export const isSupportedLanguage = (language: string | null | undefined): boolean =>
    !!language && (SUPPORTED_LANGUAGES as readonly string[]).includes(language);

/**
 * The filename a new buffer gets for a language. It is also the key inside the
 * shared `files` Y.Map, so it must be stable — changing it would orphan
 * everyone's existing edits.
 */
export const filenameForLanguage = (language: string | null | undefined): string =>
    isSupportedLanguage(language) ? FILENAMES[language as SupportedLanguage] : "solution.txt";
