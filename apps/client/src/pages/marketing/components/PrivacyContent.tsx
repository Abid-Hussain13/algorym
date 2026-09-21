import { Section, Subheading } from "./LegalLayout";

export function PrivacyContent() {
    const lastUpdated = 'September 2, 2026';

    return (
        <>
            <h1 className="font-display text-[clamp(36px,5vw,48px)] font-semibold tracking-[-0.03em] leading-[1.1] text-fg">
                Privacy Policy
            </h1>
            <p className="mt-3 text-[13px] text-faint">Last updated: {lastUpdated}</p>

            <div className="mt-10 grid gap-8">
                <Section title="What Algorym is">
                    <p>
                        Algorym is a real-time mock coding interview platform. A host creates a session, shares
                        an invite link with a guest, and both code in a shared editor. The host can replay the
                        session afterward and evaluate the guest. This policy explains what we collect, why we
                        collect it, and what we do with it.
                    </p>
                </Section>

                <Section title="Information we collect">
                    <Subheading>Account information (hosts only)</Subheading>
                    <p>
                        When you sign up as a host, we store your name and email address. Your password is
                        hashed — we never see or store it in plain text. We issue you an access token and a
                        refresh token (both HttpOnly cookies) to keep you authenticated.
                    </p>

                    <Subheading>Guest information</Subheading>
                    <p>
                        Guests don't create accounts. When you accept an invite link, we store the name you
                        provide and your consent status. If you choose to enter an email (optional), we store
                        that too. That's it — no password, no profile, no persistent identity beyond the
                        session.
                    </p>

                    <Subheading>Session data</Subheading>
                    <p>
                        During a live session, we persist the following for replay and evaluation purposes:
                    </p>
                    <ul className="mt-2 grid gap-2 pl-5">
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Code snapshots — a snapshot of the editor state at each run
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Run results — accepted, wrong answer, time limit exceeded, compile error, runtime
                            error, or internal error, along with execution time
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Session events — session started, question changed, session completed, or session
                            cancelled, with timestamps
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Question content — the problem statement and starter code the host selected
                        </li>
                    </ul>
                    <p className="mt-3">
                        We do not store join/leave events, in-session comments, or cursor positions. These
                        exist only during the live room and are discarded when the session ends.
                    </p>

                    <Subheading>Evaluation data</Subheading>
                    <p>
                        After a completed interview session, the host can rate the guest (weak, average, or
                        strong) and add private notes. This data is visible only to the host and is never
                        shared with the guest or any third party. Ratings and notes are not included in
                        replay.
                    </p>
                </Section>

                <Section title="How we use your information">
                    <ul className="grid gap-2 pl-5">
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            <strong className="font-semibold text-fg">To run the service.</strong> We use your
                            account info to authenticate you, your session data to power the live editor and
                            replay, and your guest info to identify participants in the room.
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            <strong className="font-semibold text-fg">To improve Algorym.</strong> We may
                            analyze aggregate, anonymized usage patterns (e.g. how many sessions use TypeScript
                            vs. Python) to prioritize features. We never look at individual code or session
                            content for this purpose.
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            <strong className="font-semibold text-fg">To communicate with you.</strong> We use
                            your email to send account-related messages (password resets, session notifications)
                            and, if you've opted in, product updates. You can unsubscribe from marketing emails
                            anytime.
                        </li>
                    </ul>
                </Section>

                <Section title="Cookies">
                    <p>
                        Algorym uses only essential authentication cookies:
                    </p>
                    <ul className="mt-2 grid gap-2 pl-5">
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            <code className="font-mono text-[13px] text-accent-text">accessToken</code> —
                            HttpOnly, short-lived, used to authenticate API requests
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            <code className="font-mono text-[13px] text-accent-text">refreshToken</code> —
                            HttpOnly, longer-lived, used to issue new access tokens
                        </li>
                    </ul>
                    <p className="mt-3">
                        We don't use tracking cookies, analytics cookies, or third-party advertising cookies.
                        There is no cookie consent banner because there are no optional cookies to consent to.
                    </p>
                </Section>

                <Section title="Third-party services">
                    <p>
                        We use the following third-party services to operate Algorym:
                    </p>
                    <ul className="mt-2 grid gap-2 pl-5">
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            <strong className="font-semibold text-fg">PostgreSQL (database).</strong> Your
                            account data, session data, and evaluation data are stored in a PostgreSQL database.
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            <strong className="font-semibold text-fg">Code execution sandbox.</strong> When you
                            run code in a session, it executes in an isolated sandbox environment provided by a
                            third-party execution service. Your code is sent to the sandbox, executed, and the
                            result is returned. Code is not retained by the sandbox provider after execution.
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            <strong className="font-semibold text-fg">Hosting infrastructure.</strong> Algorym
                            is hosted on standard cloud infrastructure. Server logs may contain IP addresses
                            and request metadata, which we retain for security and debugging purposes only.
                        </li>
                    </ul>
                </Section>

                <Section title="Data retention">
                    <p>
                        We retain your account data for as long as your account exists. Session data (code
                        snapshots, run results, session events) is retained indefinitely so you can replay
                        past sessions. If you delete your account, we remove your personal data within 30
                        days. Anonymized, non-identifying session data may be retained for aggregate
                        analytics.
                    </p>
                </Section>

                <Section title="Your rights">
                    <p>
                        Depending on your jurisdiction, you may have the right to:
                    </p>
                    <ul className="mt-2 grid gap-2 pl-5">
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Access the personal data we hold about you
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Correct inaccurate personal data
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Delete your account and associated personal data
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Export your data in a machine-readable format
                        </li>
                        <li className="list-disc text-[15px] leading-[1.6] text-muted">
                            Object to processing of your personal data
                        </li>
                    </ul>
                    <p className="mt-3">
                        To exercise any of these rights, email us at{' '}
                        <a
                            href="mailto:abidhussainme1@gmail.com"
                            className="text-accent-text transition-colors duration-[120ms] ease-default hover:text-fg"
                        >
                            abidhussainme1@gmail.com
                        </a>
                        . We'll respond within 30 days.
                    </p>
                </Section>

                <Section title="Security">
                    <p>
                        We take security seriously. Passwords are hashed with bcrypt. Authentication tokens
                        are HttpOnly and cannot be accessed by JavaScript. All data in transit is encrypted
                        via TLS. However, no method of electronic transmission or storage is 100% secure,
                        and we cannot guarantee absolute security.
                    </p>
                </Section>

                <Section title="Children's privacy">
                    <p>
                        Algorym is not intended for users under the age of 16. We do not knowingly collect
                        personal data from children. If you believe a child has provided us with personal
                        data, contact us and we'll delete it.
                    </p>
                </Section>

                <Section title="Changes to this policy">
                    <p>
                        We may update this policy from time to time. If we make material changes, we'll
                        notify you via email or a prominent notice on the site. The "Last updated" date at
                        the top reflects when the policy was last revised.
                    </p>
                </Section>

                <Section title="Contact">
                    <p>
                        For privacy-related questions or requests, email{' '}
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
