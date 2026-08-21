import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function IconRun(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />
    </svg>
  )
}
