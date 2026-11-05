import { useRef, useState } from 'react'

const timelineItems = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Scrub to any moment',
    description: 'Jump to any run, snapshot, or question change.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: 'Code as it was',
    description: 'Each run keeps its own snapshot of the editor.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: 'Verdict history',
    description: 'Every verdict marked on the timeline.',
  },
]

export function ReplaySection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  return (
    <div className="rp-wrap">
      <section className="rp-sec" data-od-id="replay" role="region" aria-label="Session replay">
      <h2 className="rp-title">
        Every session, <em>replayable.</em>
      </h2>
      <p className="rp-lede">Runs, snapshots, and question changes on one scrubable timeline.</p>

      <div className="rp-layout" data-od-id="replay-layout">
        <div className="rp-player-wrap" data-od-id="replay-player">
          {!videoReady && (
            <div className="absolute inset-0 z-[1] animate-pulse bg-surface-2" aria-hidden="true" />
          )}
          <video
            ref={videoRef}
            data-od-id="replay-video-player"
            className={videoReady ? 'block h-full w-full object-cover opacity-100 transition-opacity' : 'block h-full w-full object-cover opacity-0'}
            src="/assets/replay-demo.mp4"
            poster="/assets/replay-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Live interview replay: host and candidate working through a coding problem"
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoReady(true)}
          />
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