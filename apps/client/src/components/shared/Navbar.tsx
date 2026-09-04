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

    return (
        <nav
            className="sticky top-0 z-40 border-b border-border bg-surface/84 backdrop-blur-[12px] transition-colors duration-3 ease-default"
            aria-label="Site"
        >
            <div className="mx-auto flex h-[60px] max-w-[1200px] items-center gap-8 px-10 max-md:gap-3 max-md:px-6 max-[480px]:h-auto max-[480px]:flex-wrap max-[480px]:px-5 max-[480px]:py-2.5">
                <Link to="/" className="flex items-center no-underline hover:no-underline">
                    <img src="/logo.svg" alt="Algorym" className="h-8 w-auto max-md:h-7" />
                </Link>
                <div className="ml-auto flex items-center gap-3 max-[480px]:ml-0 max-[480px]:w-full max-[480px]:justify-between max-[480px]:border-t max-[480px]:border-border max-[480px]:pt-2.5">
                    <ThemeToggle />
                    {status === 'loading' || status === 'idle' ? (
                        <div className="h-8 w-20" />
                    ) : user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="group flex items-center gap-2 rounded-sm px-2 py-1"
                            >
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-fg max-sm:hidden">
                                    {user.name.toUpperCase()}
                                </span>
                                <ChevronDown
                                    className={`h-4 w-4 text-muted transition-all duration-200 group-hover:text-accent ${isDropdownOpen ? 'rotate-180 text-accent' : ''}`}
                                />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-border bg-surface py-1 shadow-lg">
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
                        <div className="flex items-center gap-1.5">
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
