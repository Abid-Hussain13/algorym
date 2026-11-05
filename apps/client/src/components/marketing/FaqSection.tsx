import type { ReactNode } from 'react'

interface FaqItem {
    question: string
    answer: string
}

interface FaqRow {
    id: string
    speed: string
    direction: 'left' | 'right'
    items: FaqItem[]
}

interface FaqSectionProps {
    title?: ReactNode
    subtitle?: string
    rows?: FaqRow[]
}

const faqData: FaqRow[] = [
    {
        id: 'row1',
        speed: '60s',
        direction: 'left',
        items: [
            {
                question: 'How do I start an interview?',
                answer:
                    'Create a session from your dashboard, share the invite link, and your candidate joins from the browser. Both of you land in the same editor.',
            },
            {
                question: 'Does the candidate need an account?',
                answer:
                    'No. The guest enters a name on the invite link, consents, and joins. No sign-up, nothing to install.',
            },
            {
                question: 'Which languages can we run?',
                answer:
                    'JavaScript, Python, Java, C++, and Go. Every run returns stdout, stderr, compile output, time, and memory.',
            },
            {
                question: 'Is my session private?',
                answer:
                    'Only the host and invited participants can open it. Ratings and notes are visible to the host alone.',
            },
        ],
    },
    {
        id: 'row2',
        speed: '45s',
        direction: 'right',
        items: [
            {
                question: 'Can I change the question mid-session?',
                answer:
                    'Yes. The host can push a new question while the session is live, and the editor updates for both sides.',
            },
            {
                question: 'What does the replay show?',
                answer:
                    'Runs, code snapshots, and question changes, rebuilt as a player you can scrub. Joins and comments are not part of it.',
            },
            {
                question: 'What if my connection drops?',
                answer:
                    'The room state lives on the server. Rejoin with the same invite link and continue from where the session is.',
            },
            {
                question: 'Can I cancel a session?',
                answer:
                    'Cancel it from the dashboard at any point. Both sides see the status change immediately.',
            },
        ],
    },
]

function FaqCard({ question, answer }: FaqItem) {
    return (
        <div className="faq-card">
            <h3 className="faq-card-title">{question}</h3>
            <p className="faq-card-answer">{answer}</p>
        </div>
    )
}

function HorizontalScroller({ children, speed, direction }: { children: ReactNode; speed: string; direction: 'left' | 'right' }) {
    return (
        <div className="faq-scroller">
            <div
                className={direction === 'right' ? 'faq-track faq-track-reverse' : 'faq-track'}
                style={{ ['--scroll-duration' as string]: speed }}
            >
                <div className="faq-track-group">{children}</div>
                <div className="faq-track-group" aria-hidden="true">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function FaqSection({ title, subtitle, rows = faqData }: FaqSectionProps) {
    return (
        <section className="faq-sec" data-od-id="faq">
            <div className="faq-head">
                <h2 className="faq-title">
                    {title ?? (
                        <>
                            Questions, <em>answered.</em>
                        </>
                    )}
                </h2>
                <p className="faq-lede">
                    {subtitle ?? 'How sessions, replays, and evaluations work in Algorym.'}
                </p>
            </div>
            <div className="faq-rows">
                {rows.map((row) => (
                    <HorizontalScroller key={row.id} speed={row.speed} direction={row.direction}>
                        {row.items.map((item) => (
                            <FaqCard key={item.question} question={item.question} answer={item.answer} />
                        ))}
                    </HorizontalScroller>
                ))}
            </div>
        </section>
    )
}