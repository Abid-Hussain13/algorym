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
        heading: 'Set it up',
        description: 'Pick a question, choose a mode, set a duration.',
        detail: 'Start now or schedule it. Interview mode rates the guest at the end.',
        accent: 'violet',
        icon: IconCreateSession,
    },
    {
        id: 1,
        title: 'Share link',
        heading: 'Share the link',
        description: 'The candidate joins from the browser.',
        detail: 'No account, no install. Name and consent only.',
        accent: 'teal',
        icon: IconShareLink,
    },
    {
        id: 2,
        title: 'Code together',
        heading: 'Code together',
        description: 'One editor, live cursors, instant runs.',
        detail: 'JavaScript, Python, Java, C++, Go. Verdicts on both screens.',
        accent: 'amber',
        icon: IconCodeTogether,
    },
    {
        id: 3,
        title: 'Evaluate guest',
        heading: 'Evaluate',
        description: 'Rate the guest weak, average, or strong.',
        detail: 'Host only. Never shown to the guest.',
        accent: 'rose',
        icon: IconEvaluate,
    },
    {
        id: 4,
        title: 'Watch replay',
        heading: 'Replay',
        description: 'Every run and question change on one timeline.',
        detail: 'Scrub to any moment.',
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
                    <p>Invite to replay in five steps.</p>
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
