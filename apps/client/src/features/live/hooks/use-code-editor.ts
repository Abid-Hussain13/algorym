import { useEffect, useRef, useState } from "react";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { minimalSetup } from "codemirror";
import { vim } from "@replit/codemirror-vim";
import { yCollab, yUndoManagerKeymap } from "y-codemirror.next";
import type { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { editorTheme } from "../lib/editor-theme";
import { editorCompletions, completionKeymaps } from "../lib/editor-completions";
import { languageExtension } from "../lib/editor-language-extensions";
import { useEditorPreferences, type EditorMode } from "./use-editor-preferences";

/**
 * Editor appearance and keymap, applied through a `Compartment` so they can be
 * swapped live.
 *
 * A compartment — rather than putting the values in the mount effect's
 * dependency list — because this hook builds its `EditorView` once per buffer.
 * Rebuilding it on every font-size click would destroy and recreate the
 * document view, throwing away the cursor position, selection and scroll
 * offset. `reconfigure` swaps the extension in place.
 */
function preferencesExtension(mode: EditorMode, fontSize: number): Extension {
    return [
        EditorView.theme({
            "&": { fontSize: `${fontSize}px` },
            "& .cm-content": { fontSize: `${fontSize}px` },
            // Gutters track the code but sit a step smaller, so the line numbers
            // stay visually subordinate instead of competing with the code.
            "& .cm-gutters": { fontSize: `${Math.max(9, fontSize - 2)}px` },
        }),
        // `vim()` is last so its keymap wins over `minimalSetup`'s defaults.
        // Left-to-right precedence in CodeMirror is earlier-higher, so placing
        // it after the others would let normal-mode bindings shadow it.
        ...(mode === "vim" ? [vim()] : []),
    ];
}

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
    const { mode, fontSize } = useEditorPreferences();

    // One compartment for the whole preferences extension, created once per
    // hook instance and reused across buffer switches.
    const preferencesCompartment = useRef(new Compartment()).current;

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
                    // vim() has to come before the shared keymaps, or its normal
                    // mode bindings get shadowed by the defaults below.
                    preferencesCompartment.of(preferencesExtension(mode, fontSize)),
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
        // `mode` and `fontSize` are intentionally absent: preference changes are
        // applied by the effect below via reconfigure, not by a rebuild.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [yText, awareness, language, preferencesCompartment]);

    useEffect(() => {
        view?.dispatch({
            effects: preferencesCompartment.reconfigure(preferencesExtension(mode, fontSize)),
        });
    }, [view, mode, fontSize, preferencesCompartment]);

    return { containerRef, view };
}
