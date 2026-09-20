import { toast } from "sonner"
import { cn } from "@/lib/utils/cn"
import { useTheme } from "@/hooks/use-theme"
import { AVAILABLE_LANGUAGES } from "@/features/questions/constants"
import { DURATION_OPTIONS } from "@/features/sessions/constants"
import { useUserPreferences, useUpdatePreferences } from "../hooks/use-user"
import { SectionCard } from "./SectionCard"
import { FieldRow } from "./FieldRow"
import type { ThemePreference } from "@algorym/shared-types"

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
]

export function PreferencesSection() {
    const { setTheme: applyTheme } = useTheme()
    const { data: prefs } = useUserPreferences()
    const updatePrefs = useUpdatePreferences()

    const handleThemeChange = (theme: ThemePreference) => {
        updatePrefs.mutate(
            { theme },
            {
                onSuccess: (data) => {
                    applyTheme(data.theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : data.theme)
                    toast.success("Theme updated")
                },
            }
        )
    }

    const handleLanguageChange = (language: string) => {
        updatePrefs.mutate(
            { default_language: language || null },
            { onSuccess: () => toast.success("Default language updated") }
        )
    }

    const handleDurationChange = (minutes: number) => {
        updatePrefs.mutate(
            { default_duration_minutes: minutes },
            { onSuccess: () => toast.success("Default duration updated") }
        )
    }

    return (
        <SectionCard title="Preferences">
            <div className="flex flex-col gap-4">
                <FieldRow label="Theme">
                    <div className="flex items-center rounded-lg border border-border bg-surface p-0.5">
                        {THEME_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => handleThemeChange(opt.value)}
                                className={cn(
                                    "relative px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150",
                                    prefs?.theme === opt.value
                                        ? "bg-accent text-on-accent shadow-sm"
                                        : "text-muted hover:text-fg hover:bg-surface-2"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </FieldRow>

                <div className="h-px bg-border" />

                <FieldRow label="Default Language">
                    <select
                        value={prefs?.default_language ?? ""}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-fg outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30 cursor-pointer"
                    >
                        <option value="">None</option>
                        {AVAILABLE_LANGUAGES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </FieldRow>

                <div className="h-px bg-border" />

                <FieldRow label="Default Duration">
                    <select
                        value={prefs?.default_duration_minutes ?? 60}
                        onChange={(e) => handleDurationChange(Number(e.target.value))}
                        className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-fg outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30 cursor-pointer"
                    >
                        {DURATION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </FieldRow>
            </div>
        </SectionCard>
    )
}
