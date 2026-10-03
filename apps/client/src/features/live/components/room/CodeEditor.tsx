import { useCodeEditor } from "../../hooks/use-code-editor";
import type { WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";

interface CodeEditorProps {
    yText: Y.Text | null;
    awareness: WebsocketProvider["awareness"] | null;
    language: string | null | undefined;
}

/**
 * The editor surface.
 *
 * Deliberately thin: `useCodeEditor` owns the CodeMirror lifecycle, and this
 * only supplies the DOM node it mounts into plus a loading state.
 */
export function CodeEditor({ yText, awareness, language }: CodeEditorProps) {
    const { containerRef, view } = useCodeEditor({ yText, awareness, language });

    if (!yText || !awareness) {
        return (
            <div className="grid h-full place-items-center bg-bg text-xs text-muted">
                Waiting for the shared editor…
            </div>
        );
    }

    return (
        <div className="relative h-full min-h-0 overflow-hidden bg-bg">
            <div ref={containerRef} className="h-full overflow-auto" />
            {!view && (
                <div className="absolute inset-0 grid place-items-center text-xs text-muted">
                    Loading editor…
                </div>
            )}
        </div>
    );
}
