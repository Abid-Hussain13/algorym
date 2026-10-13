import { Spinner } from "@/components/ui/Spinner"
import { useUserPreferences } from "@/features/user"
import { ProfileSection } from "@/features/user"
import { PreferencesSection } from "@/features/user"
import { AccountSection } from "@/features/user"
import { DangerZoneSection } from "@/features/user"

export function Settings() {
    const { isLoading: prefsLoading } = useUserPreferences()

    if (prefsLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
            <h1 className="font-display text-xl font-semibold tracking-tight text-fg sm:text-2xl">
                Settings
            </h1>

            <ProfileSection />
            <PreferencesSection />
            <AccountSection />
            <DangerZoneSection />
        </div>
    )
}
