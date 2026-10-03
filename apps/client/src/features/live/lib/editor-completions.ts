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

/** Marks where the cursor should land after a completion is accepted. */
const PLACEHOLDER = "$0";

/**
 * Character offset just past the file's leading import/header block.
 *
 * Imports must not land above a `package main` (Go) or a `#!/usr/bin/env` line,
 * and appending after existing imports groups them instead of scattering them.
 * Walks only the contiguous run of blank or import-ish lines from the top, so
 * code further down is never treated as a header.
 */
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

/**
 * Turns a `LanguageSymbol` into a CodeMirror completion.
 *
 * When the symbol declares an `import`, accepting the completion inserts **both**
 * the usage at the cursor and the import line in the file's header. That is the
 * behaviour a candidate actually wants: typing `cout` in an empty C++ file
 * should not leave them facing a wall of red because `<iostream>` is missing.
 *
 * Two things this gets right that a naive version does not:
 *
 * - **Placeholder handling.** Templates use `$0` to mean "put the cursor here".
 *   A raw string insert would type the literal `$0`, so it is stripped and the
 *   cursor is placed at that offset instead.
 * - **Two dispatches, not one ChangeSet.** A `ChangeSet` validates every
 *   position against the *original* document, so shifting the usage range to
 *   account for the import throws `RangeError: Invalid change range`. Shifting
 *   and combining in one set produced `import "fmt"fmt.Printf(…)` — the newline
 *   between them swallowed, because an insert at offset 0 and a replace starting
 *   at offset 0 are the same position. So the import is dispatched first and the
 *   usage follows at coordinates valid for the already-updated document.
 *
 * The import is skipped when its `importMarker` already appears in the document,
 * so accepting the same completion twice never stacks duplicates. Yjs groups the
 * two writes into one undo step, so Ctrl-Z still reverses both together.
 */
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

/**
 * Our own completion layer: keywords plus the standard-library table.
 *
 * `override` is deliberately NOT used on `autocompletion()` — that would replace
 * the language packages' own sources instead of adding to them. Instead every
 * source is merged into the language's `data` facet below, so Python's real
 * `globalCompletion` and the JS/Go snippets all stay active alongside this one.
 */
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

/**
 * The language's own `autocomplete` data accepts either a `CompletionSource`
 * function or a plain array of completions; the packages use both forms
 * (Python ships a function, the JS and Go snippet exports are arrays).
 */
type BuiltInCompletions = CompletionSource | readonly Completion[];

/**
 * Wraps a static completion array as a `CompletionSource`.
 *
 * The JS and Go packages export their snippets as plain arrays, but `override`
 * only accepts source functions. This mirrors CodeMirror's own internal
 * `arraySource`: the list is offered only for a token already under the cursor,
 * or on an explicit request.
 */
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
    /** Completion sources the package itself ships, if any. */
    builtIn: BuiltInCompletions[];
}

/**
 * What each of the five languages can do.
 *
 * Java and C++ ship **no** completion source at all, which is why
 * `editor-symbols.ts` carries a full standard-library table for them rather than
 * just keywords — our layer is the entire autocomplete experience there. Python,
 * JavaScript and Go augment what the packages already provide.
 */
const SUPPORT: Record<string, LanguageSupport> = {
    python: { language: pythonLanguage, builtIn: [pythonGlobal] },
    javascript: { language: javascriptLanguage, builtIn: [jsSnippets] },
    go: { language: goLanguage, builtIn: [goSnippets] },
    java: { language: javaLanguage, builtIn: [] },
    cpp: { language: cppLanguage, builtIn: [] },
};

/**
 * Autocomplete plus the everyday editor behaviour that comes with it:
 * `closeBrackets` inserts the pair when you type `(` or `"`, and Backspace
 * between a pair removes both. The keymaps add `Ctrl-Space` to force completion
 * and `Escape` to dismiss it.
 */
export function editorCompletions(language: string | null | undefined): Extension {
    const support = language ? SUPPORT[language] : undefined;

    // `override` rather than the language's `data.of({ autocomplete })` facet.
    //
    // The facet route depends on `state.languageDataAt("autocomplete", pos)`
    // resolving, which it did not in this app — the sources were never consulted
    // and no popup ever appeared, even though the language itself was active and
    // highlighting worked. `override` bypasses that lookup entirely and is
    // explicit about which sources exist, so every source we want is listed
    // here: ours first, then whatever the language package ships.
    const sources = [createSource(language)];
    if (support) sources.push(...support.builtIn.map(asSource));

    return [autocompletion({ override: sources }), closeBrackets()];
}

/** Bind with `keymap.of([...])` in the editor's extension list. */
export const completionKeymaps = [...completionKeymap, ...closeBracketsKeymap];
