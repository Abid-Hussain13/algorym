import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'
import animationData from '@/assets/replay-animation.json'

const timelineItems = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Scrub frame by frame',
    description: 'Navigate to any moment question changes, code snapshots, run verdicts with the timeline scrubber.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: 'Code as it was',
    description: 'Each run snapshot captures the full editor state see exactly what the code looked like when it ran.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: 'Verdict history',
    description: 'Every run result accepted, wrong answer, runtime error marked on the timeline with color-coded badges.',
  },
]

export function ReplaySection() {
  const lottieRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = lottieRef.current
    if (!el) return
    const anim = lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    })
    return () => anim.destroy()
  }, [])

  return (
    <div className="rp-wrap">
      <section className="rp-sec" data-od-id="replay" role="region" aria-label="Session replay">
      <h2 className="rp-title">
        Every session, <em>replayable.</em>
      </h2>
      <p className="rp-lede">
        Recorded as video-style playback from persisted session events. Scrub through code changes, run results, and
        question transitions exactly as they happened.
      </p>

      <div className="rp-layout" data-od-id="replay-layout">
        <div className="rp-player-wrap" data-od-id="replay-player">
          <div ref={lottieRef} id="replay-lottie" data-od-id="replay-lottie-player" />
        </div>

        <div className="rp-timeline" data-od-id="replay-timeline">
          <div className="rp-bean" aria-hidden="true" />
          {timelineItems.map((item) => (
            <div className="rp-timeline-item" key={item.title}>
              <div className="rp-timeline-marker" />
              <div className="rp-timeline-content">
                <div className="rp-timeline-icon">{item.icon}</div>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </section>
    </div>
  )
}