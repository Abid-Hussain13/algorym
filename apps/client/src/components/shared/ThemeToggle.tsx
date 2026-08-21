'use client'

import { IconMoon, IconSun } from '@/components/icons'
import { useReducedMotion } from 'motion/react'
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils/cn'

const VT_STYLE_ID = 'algorym-theme-vt'

const VT_CSS = `
html[data-vt="rect"]::view-transition-old(root) {
  animation: none;
  mix-blend-mode: normal;
}
html[data-vt="rect"]::view-transition-new(root) {
  mix-blend-mode: normal;
  animation: alg-rect-reveal 400ms ease-out;
}
@keyframes alg-rect-reveal {
  from { clip-path: var(--vt-from, inset(100% 0 0 0)); }
  to   { clip-path: inset(0 0 0 0); }
}
`

const RECT_FROM = 'inset(0 0 100% 0)'

const ICON_VARIANTS = {
  initial: { opacity: 0, scale: 0.25, filter: 'blur(8px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const } },
  exit: { opacity: 0, scale: 0.25, filter: 'blur(8px)', transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const } },
}

export interface ThemeToggleProps extends Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'onClick'> {
  iconClassName?: string
}

export function ThemeToggle({ className, iconClassName, ...rest }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const reduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  /* eslint-disable react-hooks/set-state-in-effect */ // hydration check
  useEffect(() => {
    setMounted(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (document.getElementById(VT_STYLE_ID)) return
    const el = document.createElement('style')
    el.id = VT_STYLE_ID
    el.textContent = VT_CSS
    document.head.appendChild(el)
  }, [])

  const isDark = mounted && theme === 'dark'

  const toggle = () => {
    const next = isDark ? 'light' : 'dark'

    if (reduce || !('startViewTransition' in document)) {
      setTheme(next)
      return
    }

    const root = document.documentElement
    root.style.setProperty('--vt-from', RECT_FROM)
    root.dataset.vt = 'rect'

    const vt = (
      document as Document & {
        startViewTransition(cb: () => void): { finished: Promise<void> }
      }
    ).startViewTransition(() => setTheme(next))

    vt.finished.finally(() => {
      delete root.dataset.vt
    })
  }

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      className={cn(
        'flex items-center justify-center rounded-full border border-border bg-inset p-0.5',
        className,
      )}
      {...rest}
    >
      <span className="relative inline-grid h-6 w-6 shrink-0 place-items-center overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {mounted ? (
            <motion.span
              key={theme}
              aria-hidden
              variants={ICON_VARIANTS}
              initial={reduce ? false : 'initial'}
              animate={reduce ? { opacity: 1, filter: 'blur(0px)', scale: 1 } : 'animate'}
              exit={reduce ? undefined : 'exit'}
              className="col-start-1 row-start-1 inline-flex items-center justify-center"
            >
              {isDark ? (
                <IconSun className={cn('h-3 w-3', iconClassName)} strokeWidth={1.7} />
              ) : (
                <IconMoon className={cn('h-3 w-3', iconClassName)} strokeWidth={1.7} />
              )}
            </motion.span>
          ) : (
            <span className="col-start-1 row-start-1" />
          )}
        </AnimatePresence>
      </span>
    </button>
  )
}
