import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/features/auth"
import { SectionCard } from "./SectionCard"
import { ChangePasswordModal } from "./ChangePasswordModal"

export function ProfileSection() {
    const { user } = useAuth()
    const [passwordOpen, setPasswordOpen] = useState(false)

    return (
        <>
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
                        {/* min-w-0 is required: a flex item defaults to its intrinsic
                            width, so the input refused to shrink and pushed Change
                            past the card edge on narrow screens. */}
                        <div className="flex items-center gap-3">
                            <input
                                type="password"
                                value="••••••••"
                                readOnly
                                className="min-w-0 flex-1 rounded-lg border border-border bg-inset px-3 py-2 text-sm text-fg cursor-not-allowed opacity-70"
                            />
                            <Button variant="primary" size="sm" className="shrink-0" onClick={() => setPasswordOpen(true)}>
                                Change
                            </Button>
                        </div>
                    </div>
                </div>
            </SectionCard>

            <ChangePasswordModal open={passwordOpen} onOpenChange={setPasswordOpen} />
        </>
    )
}
