import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { useChangePassword } from "@/features/user"

interface ChangePasswordModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [errors, setErrors] = useState<Record<string, string>>({})

    const changePassword = useChangePassword()

    const validate = (): boolean => {
        const errs: Record<string, string> = {}
        if (!currentPassword) errs.current_password = "Current password is required"
        if (!newPassword) errs.new_password = "New password is required"
        else if (newPassword.length < 8) errs.new_password = "Must be at least 8 characters"
        if (newPassword !== confirmPassword) errs.confirm = "Passwords do not match"
        if (newPassword === currentPassword) errs.new_password = "New password must be different"
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleSubmit = () => {
        if (!validate()) return

        changePassword.mutate(
            { current_password: currentPassword, new_password: newPassword },
            {
                onSuccess: () => {
                    toast.success("Password changed successfully")
                    handleClose()
                },
                onError: (err: Error & { errors?: Array<{ field: string; message: string }> }) => {
                    const fieldErrors = err.errors
                    if (fieldErrors) {
                        const errs: Record<string, string> = {}
                        fieldErrors.forEach((e) => { errs[e.field] = e.message })
                        setErrors(errs)
                    } else {
                        toast.error(err.message || "Failed to change password")
                    }
                },
            }
        )
    }

    const handleClose = () => {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setErrors({})
        changePassword.reset()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="px-6 pt-6 pb-0">
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Enter your current password and choose a new one.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent/30"
                            placeholder="Enter current password"
                            autoComplete="current-password"
                        />
                        {errors.current_password && (
                            <span className="text-xs text-danger">{errors.current_password}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent/30"
                            placeholder="Enter new password"
                            autoComplete="new-password"
                        />
                        {errors.new_password && (
                            <span className="text-xs text-danger">{errors.new_password}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent/30"
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                        />
                        {errors.confirm && (
                            <span className="text-xs text-danger">{errors.confirm}</span>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-6 pb-6">
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit}
                        loading={changePassword.isPending}
                    >
                        Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
