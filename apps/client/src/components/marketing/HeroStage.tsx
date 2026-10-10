import heroHost from '@/assets/hero-host.png'
import { EditorResultCard } from '@/components/marketing/HeroStageCards/EditorResultCard'
import { LiveSessionCard } from '@/components/marketing/HeroStageCards/LiveSessionCard'
import { ReplayEvalCard } from '@/components/marketing/HeroStageCards/ReplayEvalCard'

const ORBITS = [
  { wrap: 'h-[136px] w-[136px] sm:h-[164px] sm:w-[164px] md:h-[200px] md:w-[200px] [animation-delay:-0.25s]', ring: 'border-accent/22 animate-orbit', dot: 'bg-accent' },
  { wrap: 'h-[190px] w-[190px] sm:h-[228px] sm:w-[228px] md:h-[280px] md:w-[280px] [animation-delay:-0.12s]', ring: 'border-p-teal/28 animate-orbit-reverse', dot: 'bg-p-teal' },
  { wrap: 'h-[244px] w-[244px] sm:h-[294px] sm:w-[294px] md:h-[360px] md:w-[360px]', ring: 'border-p-violet/26 animate-orbit-slow', dot: 'bg-p-violet' },
]

export function HeroStage() {
  return (
    <div className="relative z-[3] h-[300px] w-[300px] flex-shrink-0 animate-rise overflow-visible sm:h-[360px] sm:w-[360px] md:h-[440px] md:w-[440px] min-[1600px]:h-[520px] min-[1600px]:w-[520px]">
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
      <div className="il-center absolute left-1/2 top-1/2 z-10 h-[108px] w-[108px] sm:h-[130px] sm:w-[130px] md:h-[160px] md:w-[160px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full">
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