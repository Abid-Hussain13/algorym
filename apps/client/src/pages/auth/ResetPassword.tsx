import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/Button'
import { authApi, ApiError } from '@/lib/api'

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    if (!token) {
        return (
            <div className="flex min-h-[calc(100svh-60px)] items-center justify-center p-6">
                <div className="w-full max-w-[380px] text-center">
                    <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-fg">
                        Invalid link
                    </h1>
                    <p className="mt-2 text-[15px] text-muted">
                        This password reset link is invalid or missing a token.
                    </p>
                    <Link to="/forgot-password" className="mt-6 inline-block text-[14px] text-accent-text hover:text-fg">
                        Request a new link
                    </Link>
                </div>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        setLoading(true)
        try {
            await authApi.resetPassword({ token, password })
            setSuccess(true)
        } catch (e) {
            if (e instanceof ApiError && e.errors?.length) {
                toast.error(e.errors[0].message)
            } else if (e instanceof ApiError) {
                toast.error(e.message)
            } else {
                toast.error('Something went wrong')
            }
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex min-h-[calc(100svh-60px)] items-center justify-center p-6">
                <div className="w-full max-w-[380px] text-center">
                    <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-fg">
                        Password reset!
                    </h1>
                    <p className="mt-2 text-[15px] text-muted">
                        Your password has been updated. You can now sign in with your new password.
                    </p>
                    <Link to="/login" className="mt-6 inline-block text-[14px] text-accent-text hover:text-fg">
                        Go to login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-[calc(100svh-60px)] items-center justify-center p-6">
            <form onSubmit={handleSubmit} className="w-full max-w-[380px]">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-fg">
                        Reset your password
                    </h1>
                    <p className="text-[15px] text-muted">
                        Enter your new password below.
                    </p>
                </div>
                <div className="mt-6 grid gap-4">
                    <div className="grid gap-2">
                        <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                            minLength={6}
                            className="flex h-10 w-full rounded-[6px] border border-border-strong bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-faint transition-all duration-[120ms] ease-default focus:border-accent focus:shadow-[0_0_0_3px_var(--color-focus)] focus:outline-none"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                            minLength={6}
                            className="flex h-10 w-full rounded-[6px] border border-border-strong bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-faint transition-all duration-[120ms] ease-default focus:border-accent focus:shadow-[0_0_0_3px_var(--color-focus)] focus:outline-none"
                        />
                    </div>
                    <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" loading={loading}>
                        Reset password
                    </Button>
                </div>
            </form>
        </div>
    )
}
