/** Language data for the live room — deliberately **free of any CodeMirror . */

export const DEFAULT_LANGUAGE = "javascript";

/** The five languages the executor accepts (see `runCodeSchema` on the server). . */
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

/** The filename a new buffer gets for a language. It is also the key inside the . */
export const filenameForLanguage = (language: string | null | undefined): string | null =>
    isSupportedLanguage(language) ? FILENAMES[language as SupportedLanguage] : null;

/** Filename older builds created when the session language was not yet known. . */
export const LEGACY_FILENAME = "solution.txt";
