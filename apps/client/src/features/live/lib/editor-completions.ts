import {
    autocompletion,
    closeBrackets,
    closeBracketsKeymap,
    completionKeymap,
    type Completion,
    type CompletionContext,
    type CompletionResult,
    type CompletionSource,
} from "@codemirror/autocomplete";
import { cppLanguage } from "@codemirror/lang-cpp";
import { goLanguage, snippets as goSnippets } from "@codemirror/lang-go";
import { javaLanguage } from "@codemirror/lang-java";
import { javascriptLanguage, snippets as jsSnippets } from "@codemirror/lang-javascript";
import { globalCompletion as pythonGlobal, pythonLanguage } from "@codemirror/lang-python";
import type { Extension } from "@codemirror/state";
import type { Language } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { libraryForLanguage, symbolsForLanguage, type LanguageSymbol } from "./editor-symbols";

/** Marks where the cursor should land after a completion is accepted. . */
const PLACEHOLDER = "$0";

/** Character offset just past the file's leading import/header block. . */
const headerInsertOffset = (doc: string): number => {
    const isHeaderLine = /^(?:import\b|from\b.*\bimport\b|#include\b|package\b|using\b|#!|@)/;

    let offset = 0;
    for (const line of doc.split("\n")) {
        const trimmed = line.trim();
        if (trimmed === "" || isHeaderLine.test(trimmed)) {
            offset += line.length + 1;
        } else {
            break;
        }
    }

    return Math.min(offset, doc.length);
};

/** Turns a `LanguageSymbol` into a CodeMirror completion. . */
const toCompletion = (symbol: LanguageSymbol, docText: () => string): Completion => {
    const template = symbol.insert ?? symbol.label;
    const insertText = template.split(PLACEHOLDER).join("");
    const cursorAt = template.includes(PLACEHOLDER) ? template.indexOf(PLACEHOLDER) : insertText.length;

    return {
        label: symbol.label,
        type: symbol.type,
        detail: symbol.detail,
        info: symbol.info,
        apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
            const doc = docText();
            const marker = symbol.importMarker;

            // No marker means we cannot tell whether it is already there, so we
            // insert. Every symbol in the table that carries an import also
            // carries a marker, so this is the defensive branch only.
            const needsImport = !!symbol.import && (!marker || !doc.includes(marker));

            let at = from;
            let end = to;

            if (needsImport && symbol.import) {
                const importAt = headerInsertOffset(doc);
                view.dispatch({ changes: { from: importAt, insert: `${symbol.import}\n` } });

                // Anything at or after the insertion point moves down.
                if (importAt <= from) {
                    const shift = symbol.import.length + 1;
                    at += shift;
                    end += shift;
                }
            }

            view.dispatch({
                changes: { from: at, to: end, insert: insertText },
                selection: { anchor: at + cursorAt },
                scrollIntoView: true,
            });
        },
    };
};

/** Our own completion layer: keywords plus the standard-library table. . */
const createSource = (language: string | null | undefined): CompletionSource =>
    (context: CompletionContext) => {
        const keywords = symbolsForLanguage(language);
        const library = libraryForLanguage(language);

        if (keywords.length === 0 && library.length === 0) return null;

        const typed = context.matchBefore(/[\w.]+$/);

        // Explicitness beats noise: library symbols only volunteer once
        // something has been typed, so Ctrl-Space on an empty line is a keyword
        // list rather than 60 entries.
        if (!context.explicit && (!typed || typed.from === typed.to)) return null;

        const from = typed ? typed.from : context.pos;
        const docText = () => context.state.doc.toString();

        // Library first — those are the ones carrying an import, and they are
        // what someone typing `System` or `cout` is actually looking for.
        const options = [...library, ...keywords].map((symbol) => toCompletion(symbol, docText));

        return { from, options, validFor: /^[\w.]*$/ } satisfies CompletionResult;
    };

/** The language's own `autocomplete` data accepts either a `CompletionSource` . */
type BuiltInCompletions = CompletionSource | readonly Completion[];

/** Wraps a static completion array as a `CompletionSource`. . */
const staticSource =
    (options: readonly Completion[]): CompletionSource =>
    (context) => {
        const token =
            context.matchBefore(/[\w$.]+/) ||
            (context.explicit ? context.matchBefore(/[\w$]*/) : null);

        if (!token) return null;
        return { from: token.from, options: [...options], validFor: /^[\w$]+$/ };
    };

const asSource = (completions: BuiltInCompletions): CompletionSource =>
    typeof completions === "function" ? completions : staticSource(completions);

interface LanguageSupport {
    /** Retained for clarity about which language each entry describes; the
     *  parser itself is installed separately by `languageExtension`. */
    language: Language;
    /** Completion sources the package itself ships, if any. . */
    builtIn: BuiltInCompletions[];
}

/** What each of the five languages can do. . */
const SUPPORT: Record<string, LanguageSupport> = {
    python: { language: pythonLanguage, builtIn: [pythonGlobal] },
    javascript: { language: javascriptLanguage, builtIn: [jsSnippets] },
    go: { language: goLanguage, builtIn: [goSnippets] },
    java: { language: javaLanguage, builtIn: [] },
    cpp: { language: cppLanguage, builtIn: [] },
};

/** Autocomplete plus the everyday editor behaviour that comes with it: . */
export function editorCompletions(language: string | null | undefined): Extension {
    const support = language ? SUPPORT[language] : undefined;

    // `override` rather than the language's `data.of({ autocomplete })` facet.
    const sources = [createSource(language)];
    if (support) sources.push(...support.builtIn.map(asSource));

    return [autocompletion({ override: sources }), closeBrackets()];
}

/** Bind with `keymap.of([...])` in the editor's extension list. . */
export const completionKeymaps = [...completionKeymap, ...closeBracketsKeymap];
