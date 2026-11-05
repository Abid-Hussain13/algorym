import { useRef, useState } from 'react'

import { ImageWithSkeleton } from '@/components/ui/ImageWithSkeleton'

type Tone = 'interviewer' | 'candidate'

interface Cap {
  title: string
  sub: string
}

interface RolePane {
  id: Tone
  label: string
  heading: string
  description: string
  caps: Cap[]
  image: string
  alt: string
}

const panes: RolePane[] = [
  {
    id: 'interviewer',
    label: 'Interviewer',
    heading: 'The host',
    description: 'Runs the whole session. Notes and settings stay private.',
    caps: [
      { title: 'Share an invite link', sub: 'signed in' },
      { title: 'Change the question live', sub: 'mid-session' },
      { title: 'Start, complete, cancel', sub: 'any time' },
      { title: 'Private notes', sub: 'guest never sees' },
      { title: 'Run code live', sub: '5 languages' },
      { title: 'Rate the guest', sub: 'weak \u00b7 average \u00b7 strong' },
    ],
    image: '/interviewer.png',
    alt: 'Interviewer hosting a live coding session',
  },
  {
    id: 'candidate',
    label: 'Candidate',
    heading: 'The candidate',
    description: 'Joins by link, codes live, sees only the problem and the output.',
    caps: [
      { title: 'Join by link', sub: 'no account' },
      { title: 'Name + consent', sub: 'one step' },
      { title: 'Shared editor', sub: 'live cursors' },
      { title: 'Follow the question', sub: 'host updates it' },
      { title: 'Run & see output', sub: 'live verdicts' },
      { title: 'Rejoin anytime', sub: 'same link' },
    ],
    image: '/candidate.png',
    alt: 'Candidate joining a live coding session as a guest',
  },
]

export function Roles() {
  const [active, setActive] = useState<Tone>('interviewer')
  const tabRefs = useRef<Record<Tone, HTMLButtonElement | null>>({
    interviewer: null,
    candidate: null,
  })

  const activate = (tone: Tone) => {
    if (tone !== active) setActive(tone)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const order: Tone[] = ['interviewer', 'candidate']
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const next = order[(order.indexOf(active) + dir + order.length) % order.length]
    activate(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <section className="cs-sec" data-od-id="roles">
      <h2 className="cs-title">
        Two roles. <em>One live session.</em>
      </h2>
      <p className="cs-lede">One hosts. One codes. Both in the same live editor.</p>

      <div className="cs-tabs" role="tablist" aria-label="Session roles">
        {panes.map((pane) => (
          <button
            key={pane.id}
            ref={(el) => {
              tabRefs.current[pane.id] = el
            }}
            className={`cs-tab ${active === pane.id ? 'active' : ''}`}
            data-tone={pane.id}
            role="tab"
            aria-selected={active === pane.id}
            aria-controls={`pane-${pane.id}`}
            id={`tab-${pane.id}`}
            tabIndex={active === pane.id ? 0 : -1}
            onClick={() => activate(pane.id)}
            onKeyDown={onKeyDown}
          >
            <span className="cs-tab-dot" aria-hidden="true" />
            <span>{pane.label}</span>
          </button>
        ))}
      </div>

      <div className="cs-shell cs-shell--open" id="participants">
        <div className="cs-panes">
          {panes.map((pane) => (
            <div
              key={pane.id}
              className={`cs-pane ${active === pane.id ? 'active' : ''}`}
              id={`pane-${pane.id}`}
              data-tone={pane.id}
              role="tabpanel"
              aria-labelledby={`tab-${pane.id}`}
            >
              <div className="cs-pane-row">
                <div className="cs-pane-text">
                  <h3>{pane.heading}</h3>
                  <p className="cs-pdescr">{pane.description}</p>
                  <ul className="cs-cap-list">
                    {pane.caps.map((cap) => (
                      <li key={cap.title}>
                        <span className="cs-tick" aria-hidden="true" />
                        <span>
                          {cap.title}
                          <span className="cap-sub">{cap.sub}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="cs-visual">
                  <ImageWithSkeleton
                    src={pane.image}
                    alt={pane.alt}
                    loading="lazy"
                    className="cs-plain"
                    wrapperClassName="w-full flex justify-center"
                    pendingClassName="mx-auto w-full max-w-[420px] aspect-[896/1200]"
                    skeletonClassName="rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
