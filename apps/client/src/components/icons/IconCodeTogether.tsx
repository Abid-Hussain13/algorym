import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function IconCodeTogether(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" opacity="0.5" />
    </svg>
  )
}
