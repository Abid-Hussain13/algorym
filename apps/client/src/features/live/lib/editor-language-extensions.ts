import type { Extension } from "@codemirror/state";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { isSupportedLanguage, type SupportedLanguage } from "./editor-languages";

/**
 * CodeMirror syntax highlighting per language.
 *
 * Split from `editor-languages.ts` on purpose — see the note there. Only
 * `useCodeEditor` (itself lazy-loaded) may import this module.
 */
const EXTENSIONS: Record<SupportedLanguage, Extension> = {
    javascript: javascript(),
    python: python(),
    java: java(),
    cpp: cpp(),
    go: go(),
};

/** Unknown languages get plain text rather than a wrong highlighter. */
export const languageExtension = (language: string | null | undefined): Extension =>
    isSupportedLanguage(language) ? EXTENSIONS[language as SupportedLanguage] : [];
