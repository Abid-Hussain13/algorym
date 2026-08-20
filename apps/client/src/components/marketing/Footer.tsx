import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

const footerLinks = [
    { label: 'About Us', to: '/' },
    { label: 'Contact', to: 'mailto:abidhussainme1@gmail.com' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
]

export function Footer({ className }: { className?: string }) {
    return (
        <footer className={cn('foot', className)}>
            <div className="foot-inner">
                <div className="foot-top">
                    <div className="foot-brand">
                        <div className="foot-logo">
                            <span className="foot-logo-mark" aria-hidden="true">
                                <svg width="16" height="16" viewBox="0 0 24 24">
                                    <path
                                        d="M6 5h7a4 4 0 0 1 0 8h-3v6H6V5zm7 6h2a4 4 0 0 1 0 8h-2"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                            <span className="foot-name">Algorym</span>
                        </div>
                        <p className="foot-tag">
                            Real-time algorithmic collaboration for live-coding interviews. Rehearse solo, pair live,
                            review every replay.
                        </p>
                    </div>
                    <nav className="foot-links" aria-label="Footer">
                        {footerLinks.map((link) =>
                            link.to.startsWith('mailto:') ? (
                                <a key={link.label} href={link.to} className="foot-link">
                                    {link.label}
                                </a>
                            ) : (
                                <Link key={link.label} to={link.to} className="foot-link">
                                    {link.label}
                                </Link>
                            ),
                        )}
                    </nav>
                </div>
                <div className="foot-hr" />
                <div className="foot-bottom">
                    <span className="foot-copy">© Algorym</span>
                    <a href="mailto:abidhussainme1@gmail.com" className="foot-mail">
                        <Mail aria-hidden="true" />
                        abidhussainme1@gmail.com
                    </a>
                </div>
                <div className="foot-wordmark" aria-hidden="true">
                    Algorym
                </div>
            </div>
        </footer>
    )
}