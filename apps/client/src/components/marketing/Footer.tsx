import { Link } from 'react-router-dom'
import { IconMail } from '@/components/icons'

import { cn } from '@/lib/utils/cn'

const footerLinks = [
    { label: 'About Us', to: '/' },
    { label: 'Contact', to: 'mailto:abidhussainme1@gmail.com' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
]

export function Footer({ className }: { className?: string }) {
    return (
        <footer className={cn('foot mt-[72px] md:mt-[96px]', className)}>
            <div className="foot-inner">
                <div className="foot-top">
                    <div className="foot-brand">
                        <div className="foot-logo">
                            <img src="/logo.svg" alt="Algorym" className="h-25 w-auto" />
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
                        <IconMail aria-hidden="true" />
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
