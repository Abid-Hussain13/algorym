import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function IconPresence(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="7" r="3.5" />
      <path d="M2 21v-2a4.5 4.5 0 0 1 4.5-4.5h5A4.5 4.5 0 0 1 16 19v2" opacity="0.7" />
      <circle cx="16" cy="8" r="3" />
      <path d="M22 21v-1.5a4 4 0 0 0-3-3.85" opacity="0.5" />
    </svg>
  )
}
