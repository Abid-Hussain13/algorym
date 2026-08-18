import { useState, useEffect } from 'react'
import { Plus, Link, Code, Star, Play } from 'lucide-react'

type Accent = 'violet' | 'teal' | 'amber' | 'rose' | 'accent'

interface Panel {
  id: number
  title: string
  heading: string
  description: string
  detail: string
  accent: Accent
  icon: React.ComponentType<{ title?: string; strokeWidth?: number }>
}

const panels: Panel[] = [
  {
    id: 0,
    title: 'Create session',
    heading: 'Create your session',
    description: 'Pick a question, choose a mode, and set the time limit. You become the host automatically — nothing else to set up.',
    detail: 'Two modes: interview and practice. Create a session and it goes live immediately, ready for your guest.',
    accent: 'violet',
    icon: Plus,
  },
  {
    id: 1,
    title: 'Share link',
    heading: 'Invite your guest',
    description: 'Send the tokenized invite link. Your guest joins right in the browser — no account, no install.',
    detail: 'Each link is tied to one session. The token in the URL is all a guest needs to join as a participant.',
    accent: 'teal',
    icon: Link,
  },
  {
    id: 2,
    title: 'Code together',
    heading: 'Meet in a live editor',
    description: 'Both of you edit the same document in real time — live cursors, presence, and instant code execution.',
    detail: 'Run code in 5 languages: JavaScript, Python, Java, C++, and Go. Verdicts stream back to both screens in real time.',
    accent: 'amber',
    icon: Code,
  },
  {
    id: 3,
    title: 'Evaluate guest',
    heading: 'Evaluate the guest',
    description: 'At the end, the host rates the guest: weak, average, or strong. Only the host ever sees this.',
    detail: 'The guest gets run verdicts and the session transcript — never the host\u2019s assessment. Evaluations stay private.',
    accent: 'rose',
    icon: Star,
  },
  {
    id: 4,
    title: 'Watch replay',
    heading: 'Replay the session',
    description: 'Rewatch the whole session like a video — every edit, comment, and run, in order.',
    detail: 'Built from the session event log. Scrub to any moment to review how the guest approached the problem.',
    accent: 'accent',
    icon: Play,
  },
]

export function HowItWorks() {
  const [activePanel, setActivePanel] = useState<number | null>(0)

  useEffect(() => {
    const panelEls = document.querySelectorAll('.acc-panel')

    panelEls.forEach((p, i) => {
      p.setAttribute('role', 'tab')
      p.setAttribute('aria-selected', activePanel === i ? 'true' : 'false')
      p.setAttribute('aria-controls', `panel-${i}-content`)
      p.setAttribute('id', `panel-${i}`)
      p.setAttribute('tabindex', activePanel === i ? '0' : '-1')
    })
  }, [activePanel])

  return (
    <div className="how-wrap">
      <section className="how" data-od-id="how-it-works" role="region" aria-label="How it works steps">
        <div className="how-head">
          <h2>
            How it <em>works</em>
          </h2>
          <p>From invite to replay — five steps, one flow.</p>
        </div>

        <div className="acc" role="tablist" aria-label="How it works steps">
          {panels.map((panel) => {
            const isActive = activePanel === panel.id
            return (
              <div
                key={panel.id}
                className={`acc-panel ${isActive ? 'active' : ''}`}
                data-panel={panel.id}
                data-accent={panel.accent}
                role="tab"
                aria-selected={isActive ? 'true' : 'false'}
                aria-controls={`panel-${panel.id}-content`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActivePanel(panel.id)}
              >
                <div className="acc-collapsed">
                  <div className="acc-icon">
                    <panel.icon aria-hidden="true" />
                  </div>
                  <span className="acc-title-v" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                    {panel.title}
                  </span>
                </div>
                <div
                  className="acc-expanded"
                  id={`panel-${panel.id}-content`}
                  role="tabpanel"
                  aria-labelledby={`panel-${panel.id}`}
                >
                  <h3>{panel.heading}</h3>
                  <p>{panel.description}</p>
                  <div className="acc-detail">
                    <p>{panel.detail}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}