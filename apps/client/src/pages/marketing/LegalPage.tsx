function PrivacyContent() {
  const lastUpdated = 'September 2, 2026'

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
  )
}

function TermsContent() {
  const lastUpdated = 'September 2, 2026'

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
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-[22px] font-semibold tracking-[-0.015em] leading-[1.15] text-fg">
        {title}
      </h2>
      <div className="mt-3 text-[15px] leading-[1.65] text-muted">
        {children}
      </div>
    </section>
  )
}

function Subheading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-5 mb-2 font-display text-[16px] font-semibold tracking-[-0.01em] text-fg">
      {children}
    </h3>
  )
}

export function LegalPage({ variant }: { variant: 'terms' | 'privacy' }) {
  return (
    <div className="mx-auto max-w-[800px] px-5 py-[72px] md:px-10 md:py-[96px]">
      {variant === 'privacy' ? <PrivacyContent /> : <TermsContent />}
    </div>
  )
}
