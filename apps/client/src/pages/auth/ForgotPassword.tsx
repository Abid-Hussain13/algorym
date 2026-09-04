import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/Button'
import { authApi, ApiError } from '@/lib/api'

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await authApi.forgotPassword({ email })
            setSent(true)
        } catch (e) {
            if (e instanceof ApiError) {
                toast.error(e.message)
            } else {
                toast.error('Something went wrong')
            }
        } finally {
            setLoading(false)
        }
    }

    if (sent) {
        return (
            <div className="flex min-h-[calc(100svh-60px)] items-center justify-center p-6">
                <div className="w-full max-w-[380px] text-center">
                    <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-fg">
                        Check your email
                    </h1>
                    <p className="mt-2 text-[15px] text-muted">
                        If an account exists with <strong>{email}</strong>, we've sent a password reset link.
                    </p>
                    <Link to="/login" className="mt-6 inline-block text-[14px] text-accent-text hover:text-fg">
                        Back to login
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
                        Forgot password?
                    </h1>
                    <p className="text-[15px] text-muted">
                        Enter your email and we'll send you a reset link.
                    </p>
                </div>
                <div className="mt-6 grid gap-4">
                    <div className="grid gap-2">
                        <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="flex h-10 w-full rounded-[6px] border border-border-strong bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-faint transition-all duration-[120ms] ease-default focus:border-accent focus:shadow-[0_0_0_3px_var(--color-focus)] focus:outline-none"
                        />
                    </div>
                    <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" loading={loading}>
                        Send reset link
                    </Button>
                </div>
                <div className="mt-4 text-center text-[14px] text-muted">
                    <Link to="/login" className="text-accent-text hover:text-fg">
                        Back to login
                    </Link>
                </div>
            </form>
        </div>
    )
}
