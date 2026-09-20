import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { DeleteAccountModal } from "./DeleteAccountModal"

export function DangerZoneSection() {
    const [deleteOpen, setDeleteOpen] = useState(false)

    return (
        <>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-danger/30 bg-danger/5 p-5">
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
                    className="shrink-0 border-danger/30 text-danger hover:bg-danger/10 hover:border-danger/50"
                >
                    Delete Account
                </Button>
            </div>

            <DeleteAccountModal open={deleteOpen} onOpenChange={setDeleteOpen} />
        </>
    )
}
