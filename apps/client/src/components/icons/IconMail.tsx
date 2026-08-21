import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function IconMail(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="22 6 12 13 2 6" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" stroke="none" opacity="0.3" />
    </svg>
  )
}
