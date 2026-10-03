import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { minimalSetup } from "codemirror";
import { yCollab, yUndoManagerKeymap } from "y-codemirror.next";
import type { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { editorTheme } from "../lib/editor-theme";
import { editorCompletions, completionKeymaps } from "../lib/editor-completions";
import { languageExtension } from "../lib/editor-language-extensions";

/** Derived from the provider so we depend on no extra package. */
type Awareness = WebsocketProvider["awareness"];

interface UseCodeEditorOptions {
    yText: Y.Text | null;
    awareness: Awareness | null;
    language: string | null | undefined;
}

/**
 * Mounts a CodeMirror 6 editor bound to one shared `Y.Text`.
 *
 * `yCollab` is what makes this collaborative: it wires the editor to the Yjs
 * document so local edits are broadcast as CRDT updates, remote edits arrive as
 * edits, and remote cursors/selections are drawn automatically using each
 * peer's awareness colour.
 *
 * **`minimalSetup`, not `basicSetup`, is deliberate.** `basicSetup` includes
 * CodeMirror's own `history()`, which records remote edits as if the local user
 * had typed them — so undo would walk other people's changes, and undo state
 * would fight the Yjs `UndoManager`. `minimalSetup` drops `history()`, and
 * `yUndoManagerKeymap` supplies undo that only touches your own edits.
 *
 * Switching tabs changes `yText`, so the effect tears the old view down and
 * builds a new one for the newly active buffer.
 */
export function useCodeEditor({ yText, awareness, language }: UseCodeEditorOptions) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [view, setView] = useState<EditorView | null>(null);

    useEffect(() => {
        const parent = containerRef.current;
        if (!parent || !yText || !awareness) return;

        const undoManager = new Y.UndoManager(yText);

        const view = new EditorView({
            state: EditorState.create({
                // Seed from the shared text. ySync immediately reconciles this
                // with the document, so a late-joining client is corrected
                // rather than overwriting what is already there.
                doc: yText.toString(),
                extensions: [
                    minimalSetup,
                    keymap.of([...yUndoManagerKeymap, ...completionKeymaps]),
                    yCollab(yText, awareness, { undoManager }),
                    languageExtension(language),
                    editorCompletions(language),
                    EditorView.lineWrapping,
                    editorTheme,
                ],
            }),
            parent,
        });

        setView(view);

        return () => {
            view.destroy();
            undoManager.destroy();
            setView(null);
        };
    }, [yText, awareness, language]);

    return { containerRef, view };
}
