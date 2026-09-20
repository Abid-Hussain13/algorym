import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { useDeleteAccount } from "@/features/user"

const CONFIRM_TEXT = "DELETE"

interface DeleteAccountModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeleteAccountModal({ open, onOpenChange }: DeleteAccountModalProps) {
    const [input, setInput] = useState("")
    const navigate = useNavigate()
    const deleteAccount = useDeleteAccount()

    const canDelete = input === CONFIRM_TEXT

    const handleSubmit = () => {
        if (!canDelete) return

        deleteAccount.mutate(undefined, {
            onSuccess: () => {
                toast.success("Account deleted successfully")
                navigate("/")
                window.location.reload()
            },
            onError: (err: Error) => {
                toast.error(err.message || "Failed to delete account")
            },
        })
    }

    const handleClose = () => {
        setInput("")
        deleteAccount.reset()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-danger">Delete Account</DialogTitle>
                    <DialogDescription>
                        This permanently deletes your account and all associated data including
                        questions, sessions, reports, and preferences. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 px-6 py-4">
                    <label className="text-xs font-medium text-muted">
                        Type <span className="font-mono font-semibold text-danger">{CONFIRM_TEXT}</span> to confirm
                    </label>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg font-mono outline-none transition-colors placeholder:text-faint focus:border-danger focus:ring-1 focus:ring-danger/30"
                        placeholder={CONFIRM_TEXT}
                        autoFocus
                    />
                </div>

                <DialogFooter>
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit}
                        loading={deleteAccount.isPending}
                        disabled={!canDelete}
                        className="bg-danger border-danger hover:bg-danger/90 hover:border-danger/90"
                    >
                        Delete Account
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
