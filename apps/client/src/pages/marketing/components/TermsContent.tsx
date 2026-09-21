import { Section, Subheading } from "./LegalLayout";

export function TermsContent() {
    const lastUpdated = 'September 2, 2026';

    return (
        <>
            <h1 className="font-display text-[clamp(36px,5vw,48px)] font-semibold tracking-[-0.03em] leading-[1.1] text-fg">
                Terms of Service
            </h1>
            <p className="mt-3 text-[13px] text-faint">Last updated: {lastUpdated}</p>

            <div className="mt-10 grid gap-8">
                <Section title="Acceptance of terms">
                    <p>
                        By accessing or using Algorym ("the Service"), you agree to these Terms of Service.
                        If you don't agree, don't use the Service. We may update these terms from time to
                        time — continued use after changes means you accept the new terms.
                    </p>
                </Section>

                <Section title="What Algorym provides">
                    <p>
                        Algorym is a real-time mock coding interview platform. Hosts create sessions,
                        invite guests via a shared link, and both participants code in a shared editor.
                        Hosts can replay sessions and evaluate guests. The Service is provided "as is"
                        and we make no guarantees about availability, uptime, or fitness for any
                        particular purpose.
                    </p>
                </Section>

                <Section title="Accounts">
                    <Subheading>Hosts</Subheading>
                    <p>
                        You must create an account to host sessions. You're responsible for keeping your
                        credentials secure and for all activity that happens under your account. Don't
                        share your account with others. If you suspect unauthorized access, contact us
                        immediately.
                    </p>

                    <Subheading>Guests</Subheading>
                    <p>
                        Guests don't need accounts. You join a session by clicking an invite link, entering
                        your name, and consenting to session recording. You're still bound by these terms
                        while using the Service.
                    </p>
                </Section>

                <Section title="Acceptable use">
                    <p>You agree not to:</p>
                    <ul className="mt-2 grid gap-2 pl-5">
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Use the Service for any illegal purpose or in violation of any law or regulation
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Attempt to gain unauthorized access to any part of the Service, other accounts,
                            or connected systems
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Interfere with or disrupt the Service, servers, or networks
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Use automated tools (bots, scrapers) to access the Service
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Submit code that contains malware, exploits, or attempts to compromise the
                            execution sandbox
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Misrepresent your identity or affiliation when joining a session as a guest
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Use the Service to harass, abuse, or harm other participants
                        </li>
                    </ul>
                </Section>

                <Section title="Intellectual property">
                    <Subheading>Our IP</Subheading>
                    <p>
                        The Service itself — its code, design, branding, and documentation — belongs to
                        Algorym. These terms don't grant you any rights to use our trademarks, logos, or
                        brand names without prior written consent.
                    </p>

                    <Subheading>Your code</Subheading>
                    <p>
                        You retain full ownership of any code you write during a session. We don't claim
                        any intellectual property rights over your submissions. We store code snapshots
                        solely to power the replay feature and to provide the Service to you.
                    </p>

                    <Subheading>Session data</Subheading>
                    <p>
                        Session recordings (code snapshots, run results, session events) are owned by the
                        host who created the session. Guests consent to this data being captured and stored
                        when they join a room. The host can view, replay, and evaluate based on this data.
                    </p>
                </Section>

                <Section title="Guest consent">
                    <p>
                        When you join a session as a guest, you explicitly consent to your editor activity
                        being captured and processed. This consent is required to enter the room — if you
                        decline, you cannot join. Consent covers code snapshots and run results only. It
                        does not cover personal data beyond what you provide (name and optional email).
                        You can request deletion of your data at any time by contacting us.
                    </p>
                </Section>

                <Section title="Payment and billing">
                    <p>
                        Algorym's pricing is described on our pricing page. By subscribing, you authorize
                        us to charge your payment method on a recurring basis. All payments are non-refundable
                        unless required by applicable law. We reserve the right to change pricing with
                        reasonable notice.
                    </p>
                </Section>

                <Section title="Service availability">
                    <p>
                        We aim to keep Algorym running smoothly, but we don't guarantee uninterrupted
                        service. We may temporarily suspend or restrict access for maintenance, updates,
                        or circumstances beyond our control. We'll try to give reasonable notice before
                        planned downtime.
                    </p>
                </Section>

                <Section title="Limitation of liability">
                    <p>
                        To the maximum extent permitted by law, Algorym and its operators shall not be
                        liable for any indirect, incidental, special, consequential, or punitive damages
                        arising from your use of the Service. Our total liability for any claim related
                        to the Service shall not exceed the amount you paid us in the 12 months preceding
                        the claim.
                    </p>
                    <p className="mt-3">
                        We are not responsible for the outcomes of interviews conducted using the Service.
                        Algorym is a tool — the hiring decision rests entirely with the host and their
                        organization.
                    </p>
                </Section>

                <Section title="Termination">
                    <p>
                        You can delete your account at any time from your settings. We may suspend or
                        terminate your access if you violate these terms, with or without notice.
                        Upon termination, your right to use the Service ceases immediately. We may retain
                        your data as described in our Privacy Policy.
                    </p>
                </Section>

                <Section title="Governing law">
                    <p>
                        These terms are governed by the laws of the jurisdiction in which Algorym operates,
                        without regard to conflict of law principles. Any disputes arising from these terms
                        or the Service shall be resolved in the courts of that jurisdiction.
                    </p>
                </Section>

                <Section title="Changes to these terms">
                    <p>
                        We may revise these terms at any time. If we make material changes, we'll notify
                        you by email or a prominent notice on the site. Your continued use of the Service
                        after changes take effect constitutes acceptance of the revised terms.
                    </p>
                </Section>

                <Section title="Contact">
                    <p>
                        Questions about these terms? Email{' '}
                        <a
                            href="mailto:abidhussainme1@gmail.com"
                            className="text-accent-text transition-colors duration-[120ms] ease-default hover:text-fg"
                        >
                            abidhussainme1@gmail.com
                        </a>
                        .
                    </p>
                </Section>
            </div>
        </>
    );
}
