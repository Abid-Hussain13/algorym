import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { authApi, ApiError } from '@/lib/api'

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>(() => token ? 'loading' : 'error')
    const [message, setMessage] = useState(() => token ? 'Verifying your email...' : 'No verification token provided')

    useEffect(() => {
        if (!token) return

        let cancelled = false
        authApi.verifyEmail(token)
            .then(() => {
                if (!cancelled) {
                    setStatus('success')
                    setMessage('Your email has been verified!')
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    setStatus('error')
                    if (e instanceof ApiError) {
                        setMessage(e.message)
                    } else {
                        setMessage('Something went wrong')
                    }
                }
            })

        return () => { cancelled = true }
    }, [token])

    return (
        <div className="flex min-h-[calc(100svh-60px)] items-center justify-center p-6">
            <div className="w-full max-w-[380px] text-center">
                {status === 'loading' && (
                    <>
                        <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-fg">
                            Verifying your email...
                        </h1>
                        <p className="mt-2 text-[15px] text-muted">Please wait.</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-fg">
                            Email verified!
                        </h1>
                        <p className="mt-2 text-[15px] text-muted">{message}</p>
                        <Link to="/" className="mt-6 inline-block text-[14px] text-accent-text hover:text-fg">
                            Go to home
                        </Link>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-fg">
                            Verification failed
                        </h1>
                        <p className="mt-2 text-[15px] text-muted">{message}</p>
                        <Link to="/" className="mt-6 inline-block text-[14px] text-accent-text hover:text-fg">
                            Go to home
                        </Link>
                    </>
                )}
            </div>
        </div>
    )
}
