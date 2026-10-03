import { AVAILABLE_LANGUAGES } from "@/features/questions";
import { Button } from "@/components/ui/Button";
import { isSupportedLanguage } from "../../lib/editor-languages";

interface EditorControlsProps {
    language: string | null;
    availableLanguages: string[];
    onLanguageChange: (language: string) => void;
    onRun: () => void;
    isRunning: boolean;
    canRun: boolean;
    /** Language is fixed once candidates are in the room — host only can change it. */
    canChangeLanguage: boolean;
    /** Why Run is unavailable, shown in the tooltip. */
    blockedReason?: string | null;
}

/**
 * The editor's right-aligned controls: **Run**, then the language picker last.
 *
 * Both live in the tab strip rather than a separate toolbar row so the editor
 * gets the vertical space back — on a full-screen room every row is real estate.
 */
export function EditorControls({
    language,
    availableLanguages,
    onLanguageChange,
    onRun,
    isRunning,
    canRun,
    canChangeLanguage,
    blockedReason,
}: EditorControlsProps) {
    const options = availableLanguages.filter(isSupportedLanguage);
    const hasLanguage = isSupportedLanguage(language);

    return (
        <>
            <Button
                variant="primary"
                size="sm"
                loading={isRunning}
                disabled={!canRun}
                onClick={onRun}
                title={canRun ? "Run the active file" : blockedReason ?? "Waiting for the shared editor…"}
                className="h-6 px-2.5 py-0 text-xs"
            >
                Run
            </Button>

            {hasLanguage ? (
                <select
                    value={language ?? ""}
                    disabled={!canChangeLanguage || options.length === 0}
                    onChange={(event) => onLanguageChange(event.target.value)}
                    aria-label="Language"
                    title={canChangeLanguage ? "Session language" : "Only the host can change the language"}
                    className="h-6 rounded border border-border bg-bg px-1.5 text-[11px] text-fg disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {(options.length > 0 ? options : [language!]).map((value) => (
                        <option key={value} value={value}>
                            {AVAILABLE_LANGUAGES.find((l) => l.value === value)?.label ?? value}
                        </option>
                    ))}
                </select>
            ) : (
                /* No language on the session: show the problem instead of a
                   plausible-looking dropdown that would do nothing. */
                <span
                    className="rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-warning"
                    title="This session has no language set, so code cannot be run"
                >
                    No language
                </span>
            )}
        </>
    );
}
