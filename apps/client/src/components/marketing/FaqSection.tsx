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
                question: 'How do I start a live interview?',
                answer:
                    'Create a board, share the link with your partner, and jump in. Code appears on screen in real time for both of you.',
            },
            {
                question: 'Is my session data private?',
                answer:
                    'Yes. Sessions are persisted as event logs only you and invited participants can access — never shared or sold.',
            },
            {
                question: 'Can I review a past session?',
                answer:
                    'Absolutely. Every session is replayable — scrub through code changes, run results, and question transitions exactly as they happened.',
            },
            {
                question: 'Do I need a real partner to rehearse?',
                answer:
                    'No. You can rehearse solo whenever you want, and pair up with a real partner when you are ready to go live.',
            },
        ],
    },
    {
        id: 'row2',
        speed: '45s',
        direction: 'right',
        items: [
            {
                question: 'Can my team use Algorym together?',
                answer:
                    'Yes. Invite colleagues to a board to collaborate on the same algorithm in real time, with presence for every participant.',
            },
            {
                question: 'What happens if my internet drops mid-interview?',
                answer:
                    'Your progress is saved from persisted events. Reconnect and your session picks right back up without losing anything.',
            },
            {
                question: 'Is there a free plan?',
                answer:
                    'Yes — start free and rehearse as much as you like. Upgrade when you need more boards and teammates.',
            },
            {
                question: 'How do I cancel anytime?',
                answer:
                    'Cancel from your account settings in two clicks. Your boards and replays remain accessible until the end of your billing period.',
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
                    {subtitle ??
                        'Everything you need to know about running and reviewing live coding interviews with Algorym.'}
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