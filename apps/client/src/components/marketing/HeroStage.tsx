import heroHost from '@/assets/hero-host.png'
import { EditorResultCard } from '@/components/marketing/HeroStageCards/EditorResultCard'
import { LiveSessionCard } from '@/components/marketing/HeroStageCards/LiveSessionCard'
import { ReplayEvalCard } from '@/components/marketing/HeroStageCards/ReplayEvalCard'

const ORBITS = [
  { wrap: 'h-[200px] w-[200px] [animation-delay:-0.25s]', ring: 'border-accent/22 animate-orbit', dot: 'bg-accent' },
  { wrap: 'h-[280px] w-[280px] [animation-delay:-0.12s]', ring: 'border-p-teal/28 animate-orbit-reverse', dot: 'bg-p-teal' },
  { wrap: 'h-[360px] w-[360px]', ring: 'border-p-violet/26 animate-orbit-slow', dot: 'bg-p-violet' },
]

export function HeroStage() {
  return (
    <div className="relative z-[3] h-[440px] w-[440px] flex-shrink-0 animate-rise overflow-visible max-[1280px]:[zoom:.9] max-[1200px]:[zoom:.82] max-[1150px]:[zoom:.74] max-[1100px]:[zoom:.66] max-[1024px]:[zoom:.6] max-[768px]:[zoom:.52] max-[640px]:[zoom:.46] max-[480px]:[zoom:.4] min-[1600px]:[zoom:1.12] min-[2400px]:[zoom:1.3]">
      {/* Orbit rings + dots — appear/disappear together with bouncy scale, like reference */}
      {ORBITS.map((orbit) => (
        <div
          key={orbit.ring}
          className={`il-ring-wrap animate-ring-cycle absolute left-1/2 top-1/2 pointer-events-none [transform:translate(-50%,-50%)] ${orbit.wrap}`}
        >
          <div
            className={`il-orbit absolute inset-0 rounded-full border-[1.5px] border-dashed ${orbit.ring}`}
          >
            <span className={`il-dot absolute -top-1 left-1/2 -ml-1 h-2 w-2 rounded-full ${orbit.dot}`} />
          </div>
        </div>
      ))}

      {/* Center avatar */}
      <div className="il-center absolute left-1/2 top-1/2 z-10 h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full">
        <img
          src={heroHost}
          alt="Host"
          className="block h-full w-full object-cover scale-[1.3] [transform-origin:50%_28%]"
        />
      </div>

      {/* Illustration cards */}
      <LiveSessionCard />
      <EditorResultCard />
      <ReplayEvalCard />
    </div>
  )
}