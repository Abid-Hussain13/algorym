import { Link } from 'react-router-dom'

import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  return (
    <nav
      className="sticky top-0 z-40 border-b border-border bg-surface/84 backdrop-blur-[12px] transition-colors duration-3 ease-default"
      aria-label="Site"
    >
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center gap-8 px-10 max-md:gap-3 max-md:px-6 max-[480px]:h-auto max-[480px]:flex-wrap max-[480px]:px-5 max-[480px]:py-2.5">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-display text-[20px] font-semibold tracking-[-0.02em] text-fg no-underline hover:no-underline max-md:text-[18px]"
        >
          <span className="grid h-7 w-7 place-items-center rounded-sm bg-accent text-on-accent shadow-sm max-md:h-[26px] max-md:w-[26px]">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 5h7a4 4 0 0 1 0 8h-3v6H6V5zm7 6h2a4 4 0 0 1 0 8h-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Algorym
        </Link>
        <div className="ml-auto flex items-center gap-3 max-[480px]:ml-0 max-[480px]:w-full max-[480px]:justify-between max-[480px]:border-t max-[480px]:border-border max-[480px]:pt-2.5">
          <ThemeToggle />
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
            <Button variant="primary" size="sm">
              Sign up
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}