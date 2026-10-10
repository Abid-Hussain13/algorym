import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'

import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { useAppSelector, useAppDispatch, selectUser, selectAuthStatus } from '@/stores'
import { logoutThunk } from '@/stores/auth-slice'

export function Navbar() {
    const user = useAppSelector(selectUser)
    const status = useAppSelector(selectAuthStatus)
    const dispatch = useAppDispatch()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const scrollToTop = () => {
        window.scrollTo(0, 0)
    }

    return (
        <nav
            className="sticky top-0 z-40 border-b border-border bg-surface/84 backdrop-blur-[12px] transition-colors duration-3 ease-default"
            aria-label="Site"
        >
            <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-5 md:h-[60px] md:gap-8 md:px-10">
                <Link to="/" onClick={scrollToTop} className="flex shrink-0 items-center no-underline hover:no-underline">
                    <img src="/logo.svg" alt="Algorym" className="h-7 w-auto md:h-8" />
                </Link>

                <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
                    <ThemeToggle />

                    {user ? (
                        <Button asChild variant="primary" size="sm">
                            <Link to="/app" className="hidden sm:inline-flex">
                                Dashboard
                            </Link>
                        </Button>
                    ) : null}

                    {status === 'loading' || status === 'idle' ? (
                        <div className="h-8 w-20 shrink-0" />
                    ) : user ? (
                        <div className="relative shrink-0" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="group flex items-center gap-2 rounded-sm py-1"
                            >
                                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="hidden max-w-[140px] truncate text-sm font-medium text-fg lg:inline">
                                    {user.name.toUpperCase()}
                                </span>
                                <ChevronDown
                                    className={`h-4 w-4 shrink-0 text-muted transition-all duration-200 group-hover:text-accent ${isDropdownOpen ? 'rotate-180 text-accent' : ''}`}
                                />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-border bg-surface py-1 shadow-lg">
                                    <Link
                                        to="/app"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-fg transition-colors hover:text-accent sm:hidden"
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            dispatch(logoutThunk())
                                            setIsDropdownOpen(false)
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-fg transition-colors hover:text-accent"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex shrink-0 items-center gap-1.5">
                            <Button asChild variant="ghost" size="sm">
                                <Link to="/login">Log in</Link>
                            </Button>
                            <Button asChild variant="primary" size="sm">
                                <Link to="/signup">Sign up</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
