import { useState, useEffect } from 'react'
import { IconCreateSession, IconShareLink, IconCodeTogether, IconEvaluate, IconReplay } from '@/components/icons'

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
        description:
            'Pick a question from your bank, choose interview or practice mode, and set a duration. You become the host as soon as it is created.',
        detail:
            'Interview sessions end with a private evaluation; practice sessions do not. With no scheduled time, the session starts immediately.',
        accent: 'violet',
        icon: IconCreateSession,
    },
    {
        id: 1,
        title: 'Share link',
        heading: 'Invite your candidate',
        description:
            'Send the invite link. Your candidate joins from the browser with no account and nothing to install.',
        detail:
            'Each link carries a token for a single session. The guest enters a name, consents once, and is in the room.',
        accent: 'teal',
        icon: IconShareLink,
    },
    {
        id: 2,
        title: 'Code together',
        heading: 'Meet in a live editor',
        description:
            'Both of you edit the same files in real time, with live cursors and presence, and run code without leaving the room.',
        detail:
            'Run JavaScript, Python, Java, C++, and Go in a sandbox. Every verdict, with stdout and timing, appears on both screens at once.',
        accent: 'amber',
        icon: IconCodeTogether,
    },
    {
        id: 3,
        title: 'Evaluate guest',
        heading: 'Evaluate the guest',
        description:
            'When the session ends, the host rates the guest weak, average, or strong, and adds notes. Only the host sees any of it.',
        detail: 'The guest sees run verdicts and the session itself, never the host\u2019s assessment.',
        accent: 'rose',
        icon: IconEvaluate,
    },
    {
        id: 4,
        title: 'Watch replay',
        heading: 'Replay the session',
        description: 'Rewatch the session like a video: runs, code snapshots, and question changes, in order.',
        detail:
            'Built from the session event log. Scrub to any run or question change to review how the problem was approached.',
        accent: 'accent',
        icon: IconReplay,
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
            <section className="how" id="how-it-works" data-od-id="how-it-works" role="region" aria-label="How it works steps">
                <div className="how-head">
                    <h2>
                        How it <em>works</em>
                    </h2>
                    <p>From invite link to replay, in five steps.</p>
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
                                    <span className="acc-title-v">{panel.title}</span>
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
