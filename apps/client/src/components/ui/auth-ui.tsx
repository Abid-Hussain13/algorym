'use client'

import * as React from 'react'
import { useState, useId, useEffect } from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/api/client'
import { useNavigate } from 'react-router-dom'
import { loginThunk, signupThunk, useAppDispatch } from '@/stores'

// ─── Typewriter ──────────────────────────────────────────────────────────────

export interface TypewriterProps {
    text: string | string[]
    speed?: number
    cursor?: string
    loop?: boolean
    deleteSpeed?: number
    delay?: number
}

export function Typewriter({
    text,
    speed = 100,
    cursor = '|',
    loop = false,
    deleteSpeed = 50,
    delay = 1500,
}: TypewriterProps) {
    const [displayText, setDisplayText] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [textArrayIndex, setTextArrayIndex] = useState(0)

    const textArray = Array.isArray(text) ? text : [text]
    const currentText = textArray[textArrayIndex] || ''

    useEffect(() => {
        if (!currentText) return

        const timeout = setTimeout(
            () => {
                if (!isDeleting) {
                    if (currentIndex < currentText.length) {
                        setDisplayText((prev) => prev + currentText[currentIndex])
                        setCurrentIndex((prev) => prev + 1)
                    } else if (loop) {
                        setTimeout(() => setIsDeleting(true), delay)
                    }
                } else {
                    if (displayText.length > 0) {
                        setDisplayText((prev) => prev.slice(0, -1))
                    } else {
                        setIsDeleting(false)
                        setCurrentIndex(0)
                        setTextArrayIndex((prev) => (prev + 1) % textArray.length)
                    }
                }
            },
            isDeleting ? deleteSpeed : speed,
        )

        return () => clearTimeout(timeout)
    }, [
        currentIndex,
        isDeleting,
        currentText,
        loop,
        speed,
        deleteSpeed,
        delay,
        displayText,
        text,
    ])

    return (
        <span>
            {displayText}
            <span className="animate-pulse">{cursor}</span>
        </span>
    )
}

// ─── Label ───────────────────────────────────────────────────────────────────

const Label = React.forwardRef<
    React.ElementRef<typeof LabelPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
    <LabelPrimitive.Root
        ref={ref}
        className={cn(
            'text-[12px] font-semibold uppercase tracking-[0.08em] text-faint peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            className,
        )}
        {...props}
    />
))
Label.displayName = LabelPrimitive.Root.displayName

// ─── Input ───────────────────────────────────────────────────────────────────

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    'flex h-10 w-full rounded-[6px] border border-border-strong bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-faint transition-all duration-[120ms] ease-default focus:border-accent focus:shadow-[0_0_0_3px_var(--color-focus)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-45',
                    className,
                )}
                ref={ref}
                {...props}
            />
        )
    },
)
Input.displayName = 'Input'

// ─── PasswordInput ───────────────────────────────────────────────────────────

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, label, ...props }, ref) => {
        const id = useId()
        const [showPassword, setShowPassword] = useState(false)

        return (
            <div className="grid w-full items-center gap-2">
                {label && <Label htmlFor={id}>{label}</Label>}
                <div className="relative">
                    <Input
                        id={id}
                        type={showPassword ? 'text' : 'password'}
                        className={cn('pe-10', className)}
                        ref={ref}
                        {...props}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-faint transition-colors hover:text-fg focus-visible:text-fg focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>
        )
    },
)
PasswordInput.displayName = 'PasswordInput'

// ─── Form Components ─────────────────────────────────────────────────────────

function SignInForm() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        try {
            await dispatch(loginThunk({ email, password })).unwrap();
            navigate("/");
        } catch (e) {
            console.error('Login error:', e);
            if (e instanceof ApiError) {
                toast.error(e.message);
            } else if (e instanceof Error) {
                toast.error(e.message);
            } else {
                toast.error("Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-fg">
                    Welcome back
                </h1>
                <p className="text-[15px] text-muted">Sign in to manage your sessions</p>
            </div>
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                    />
                </div>
                <PasswordInput
                    name="password"
                    label="Password"
                    required
                    autoComplete="current-password"
                    placeholder="Your password"
                />
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="mt-2 w-full"
                    loading={loading}
                >
                    Sign in
                </Button>
            </div>
        </form>
    )
}

function SignUpForm() {
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const dispatch = useAppDispatch();

    const navigate = useNavigate();
    const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)
        setFieldErrors({})
        const formData = new FormData(event.currentTarget)
        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        try {
            await dispatch(signupThunk({ name, email, password })).unwrap();
            navigate("/");
        } catch (e) {
            console.error('Signup error:', e);
            if (e instanceof ApiError) {
                toast.error(e.message);
            } else if (e instanceof Error) {
                toast.error(e.message);
            } else {
                toast.error("Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-fg">
                    Create your account
                </h1>
                <p className="text-[15px] text-muted">Start hosting live coding interviews</p>
            </div>
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Your name"
                        required
                        autoComplete="name"
                    />
                    {fieldErrors.name && <p className="text-[12px] text-red-500">{fieldErrors.name}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                    />
                    {fieldErrors.email && <p className="text-[12px] text-red-500">{fieldErrors.email}</p>}
                </div>
                <PasswordInput
                    name="password"
                    label="Password"
                    required
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                />
                {fieldErrors.password && <p className="text-[12px] text-red-500">{fieldErrors.password}</p>}
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="mt-2 w-full"
                    loading={loading}
                >
                    Create account
                </Button>
            </div>
        </form>
    )
}

// ─── AuthFormContainer ───────────────────────────────────────────────────────

function AuthFormContainer({
    isSignIn,
    onToggle,
}: {
    isSignIn: boolean
    onToggle: () => void
}) {
    return (
        <div className="mx-auto grid w-[380px] gap-4">
            {isSignIn ? <SignInForm /> : <SignUpForm />}
            <div className="text-center text-[14px] text-muted">
                {isSignIn ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                    type="button"
                    onClick={onToggle}
                    className="text-accent-text transition-colors duration-[120ms] ease-default hover:text-fg"
                >
                    {isSignIn ? 'Sign up' : 'Sign in'}
                </button>
            </div>
            <div className="relative text-center text-[13px]">
                <div className="absolute inset-0 top-1/2 z-0 flex items-center border-t border-border" />
                <span className="relative z-10 bg-surface px-3 text-faint">Or continue with</span>
            </div>
            <Button
                type="button"
                variant="default"
                className="w-full"
                onClick={() => console.log('UI: Google button clicked')}
            >
                <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google icon"
                    className="mr-2 h-4 w-4"
                />
                Continue with Google
            </Button>
            <div className="text-center text-[14px] text-muted">
                Skip and Continue with{' '}
                <a
                    href='/'
                    className="text-accent-text hover:no-underline transition-colors duration-[120ms] ease-default hover:text-fg"
                >
                    Home
                </a>
            </div>
        </div>
    )
}

// ─── AuthUI ──────────────────────────────────────────────────────────────────

interface AuthContentProps {
    image?: {
        src: string
        alt: string
    }
    quote?: {
        text: string
        author: string
    }
}

interface AuthUIProps {
    initialView?: 'signin' | 'signup'
    signInContent?: AuthContentProps
    signUpContent?: AuthContentProps
}

const defaultSignInContent = {
    image: {
        src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=1200&fit=crop',
        alt: 'Code on a dark screen',
    },
    quote: {
        text: 'The best way to predict the future is to invent it.',
        author: 'Alan Kay',
    },
}

const defaultSignUpContent = {
    image: {
        src: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=1200&fit=crop',
        alt: 'Code editor with colorful syntax',
    },
    quote: {
        text: 'First, solve the problem. Then, write the code.',
        author: 'John Johnson',
    },
}

export function AuthUI({ initialView = 'signin', signInContent = {}, signUpContent = {} }: AuthUIProps) {
    const [isSignIn, setIsSignIn] = useState(initialView === 'signin')
    const toggleForm = () => setIsSignIn((prev) => !prev)

    const finalSignInContent = {
        image: { ...defaultSignInContent.image, ...signInContent.image },
        quote: { ...defaultSignInContent.quote, ...signInContent.quote },
    }
    const finalSignUpContent = {
        image: { ...defaultSignUpContent.image, ...signUpContent.image },
        quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
    }

    const currentContent = isSignIn ? finalSignInContent : finalSignUpContent

    return (
        <div className="w-full min-h-[calc(100svh-60px)] md:grid md:grid-cols-2">
            <style>{`
        input[type='password']::-ms-reveal,
        input[type='password']::-ms-clear {
          display: none;
        }
      `}</style>
            <div className="flex min-h-[calc(100svh-60px)] items-center justify-center p-6 md:h-auto md:p-0 md:py-12">
                <AuthFormContainer isSignIn={isSignIn} onToggle={toggleForm} />
            </div>

            <div
                className="hidden md:block relative bg-cover bg-center transition-all duration-500 ease-in-out"
                style={{ backgroundImage: `url(${currentContent.image.src})` }}
                key={currentContent.image.src}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-bg/80 via-bg/40 to-bg/80" />
                <div className="absolute inset-x-0 bottom-0 h-[100px] bg-gradient-to-t from-bg to-transparent" />
                <div className="relative z-10 flex h-full flex-col items-center justify-end p-2 pb-8">
                    <blockquote className="space-y-2 text-center text-fg">
                        <p className="text-[17px] font-medium">
                            &ldquo;
                            <Typewriter
                                key={currentContent.quote.text}
                                text={currentContent.quote.text}
                                speed={60}
                            />
                            &rdquo;
                        </p>
                        <cite className="block text-[13px] font-light text-muted not-italic">
                            &mdash; {currentContent.quote.author}
                        </cite>
                    </blockquote>
                </div>
            </div>
        </div>
    )
}
