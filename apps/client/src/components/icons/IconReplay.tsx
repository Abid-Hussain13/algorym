import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function IconReplay(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" opacity="0.8" />
    </svg>
  )
}
