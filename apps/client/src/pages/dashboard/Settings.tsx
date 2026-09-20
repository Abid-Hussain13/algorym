import { useState } from "react"
import { useDispatch } from "react-redux"
import { toast } from "sonner"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/Button"
import { Spinner } from "@/components/ui/Spinner"
import { useAuth } from "@/features/auth"
import { useTheme } from "@/hooks/use-theme"
import { logoutThunk } from "@/stores/auth-slice"
import type { AppDispatch } from "@/stores/store"
import {
    useUserPreferences,
    useUpdatePreferences,
    ChangePasswordModal,
    DeleteAccountModal,
} from "@/features/user"
import type { ThemePreference } from "@algorym/shared-types"

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
]

const DURATION_OPTIONS = [
    { value: 30, label: "30 min" },
    { value: 45, label: "45 min" },
    { value: 60, label: "60 min" },
    { value: 90, label: "90 min" },
    { value: 120, label: "2 hours" },
]

const LANGUAGE_OPTIONS = [
    { value: "python", label: "Python" },
    { value: "javascript", label: "JavaScript" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "go", label: "Go" },
]

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-2 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-fg">{title}</h2>
            {children}
        </div>
    )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted shrink-0">{label}</span>
            {children}
        </div>
    )
}

export function Settings() {
    const { user } = useAuth()
    const dispatch = useDispatch<AppDispatch>()
    const { setTheme: applyTheme } = useTheme()

    const { data: prefs, isLoading: prefsLoading } = useUserPreferences()
    const updatePrefs = useUpdatePreferences()

    const [passwordOpen, setPasswordOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)

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
            { default_language: language || undefined },
            { onSuccess: () => toast.success("Default language updated") }
        )
    }

    const handleDurationChange = (minutes: number) => {
        updatePrefs.mutate(
            { default_duration_minutes: minutes },
            { onSuccess: () => toast.success("Default duration updated") }
        )
    }

    const handleSignOut = () => {
        dispatch(logoutThunk())
    }

    if (prefsLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
                Settings
            </h1>

            {/* Profile */}
            <SectionCard title="Profile">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted">Full Name</label>
                        <input
                            type="text"
                            value={user?.name ?? ""}
                            readOnly
                            className="rounded-lg border border-border bg-inset px-3 py-2 text-sm text-fg cursor-not-allowed opacity-70"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted">Email</label>
                        <input
                            type="email"
                            value={user?.email ?? ""}
                            readOnly
                            className="rounded-lg border border-border bg-inset px-3 py-2 text-sm text-fg cursor-not-allowed opacity-70"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted">Password</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="password"
                                value="••••••••"
                                readOnly
                                className="flex-1 rounded-lg border border-border bg-inset px-3 py-2 text-sm text-fg cursor-not-allowed opacity-70"
                            />
                            <Button variant="default" size="sm" onClick={() => setPasswordOpen(true)}>
                                Change
                            </Button>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Preferences */}
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
                            {LANGUAGE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </FieldRow>

                    <div className="h-px bg-border" />

                    <FieldRow label="Default Duration">
                        <select
                            value={prefs?.default_duration_minutes ?? ""}
                            onChange={(e) => handleDurationChange(Number(e.target.value))}
                            className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-fg outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30 cursor-pointer"
                        >
                            <option value="">None</option>
                            {DURATION_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </FieldRow>
                </div>
            </SectionCard>

            {/* Account */}
            <SectionCard title="Account">
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="self-start text-muted hover:text-danger">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                </Button>
            </SectionCard>

            {/* Danger Zone */}
            <div className="flex flex-col gap-4 rounded-xl border border-danger/30 bg-danger/5 p-5">
                <div className="flex flex-col gap-1">
                    <h2 className="text-sm font-semibold text-danger">Danger Zone</h2>
                    <p className="text-xs text-muted leading-relaxed">
                        Permanently delete your account and all associated data including questions,
                        sessions, reports, and preferences. This action cannot be undone.
                    </p>
                </div>
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                    className="self-start border-danger/30 text-danger hover:bg-danger/10 hover:border-danger/50"
                >
                    Delete Account
                </Button>
            </div>

            <ChangePasswordModal open={passwordOpen} onOpenChange={setPasswordOpen} />
            <DeleteAccountModal open={deleteOpen} onOpenChange={setDeleteOpen} />
        </div>
    )
}
