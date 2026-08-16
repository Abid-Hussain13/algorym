import { Moon, Sun } from 'lucide-react'

import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils/cn'

const OPTIONS = [
  { value: 'light', label: 'Light', title: 'Light mode', Icon: Sun },
  { value: 'dark', label: 'Dark', title: 'Dark mode', Icon: Moon },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex rounded-full border border-border bg-inset p-0.5" role="group" aria-label="Theme">
      {OPTIONS.map(({ value, label, title, Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            title={title}
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-[11px] py-[5px] font-body text-xs font-semibold tracking-[0.02em] transition-all duration-1 ease-default',
              active ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
            )}
          >
            <Icon className="h-3 w-3" strokeWidth={1.7} aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}