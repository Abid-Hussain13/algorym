import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
    FONT_SIZES,
    useEditorPreferences,
    type EditorMode,
} from "../../hooks/use-editor-preferences";
import { cn } from "@/lib/utils/cn";

const MODES: Array<{ value: EditorMode; label: string; hint: string }> = [
    { value: "normal", label: "Normal", hint: "Standard editor keys" },
    { value: "vim", label: "Vim", hint: "Modal keys (i, Esc, :w)" },
];

/**
 * Per-user editor settings.
 *
 * Normal vs vim changes the **keymap**, not the behaviour: the vim extension
 * only remaps keys and adds vim's visual mode, so undo still goes through the
 * Yjs `UndoManager` and only ever touches your own edits. Switching is applied
 * live through a CodeMirror compartment, so it does not disturb the cursor, the
 * selection or the scroll position.
 *
 * Font size is applied the same way rather than by scaling the whole layout —
 * the room's chrome stays fixed and only the code grows.
 *
 * Both persist per browser via `localStorage`, so each user keeps their own
 * choice and it survives a reload.
 */
export function EditorPreferencesSection() {
    const { mode, fontSize, setMode, setFontSize } = useEditorPreferences();

    return (
        <div className="flex flex-col gap-4">
            {/* Editor mode */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    Editor mode
                </span>
                <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Editor mode">
                    {MODES.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={mode === option.value}
                            onClick={() => setMode(option.value)}
                            className={cn(
                                "rounded border px-2 py-1.5 text-xs font-medium transition-colors",
                                mode === option.value
                                    ? "border-accent bg-accent/10 text-fg"
                                    : "border-border text-muted hover:border-border-strong hover:text-fg"
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-muted">
                    {MODES.find((m) => m.value === mode)?.hint}
                </p>
            </div>

            {/* Font size */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    Font size
                </span>
                <div className="grid grid-cols-7 gap-1" role="group" aria-label="Editor font size">
                    {FONT_SIZES.map((size) => (
                        <button
                            key={size}
                            type="button"
                            aria-pressed={fontSize === size}
                            aria-label={`${size} pixels`}
                            onClick={() => setFontSize(size)}
                            className={cn(
                                "rounded border py-1 text-[11px] font-medium tabular-nums transition-colors",
                                fontSize === size
                                    ? "border-accent bg-accent/10 text-fg"
                                    : "border-border text-muted hover:border-border-strong hover:text-fg"
                            )}
                        >
                            {size}
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-muted">Applies to the code editor only.</p>
            </div>

            {/* Theme */}
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-fg">Theme</p>
                    <p className="text-[11px] text-muted">Light or dark, saved on this device.</p>
                </div>
                <ThemeToggle />
            </div>
        </div>
    );
}
