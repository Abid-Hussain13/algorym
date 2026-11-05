import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <div className="mx-auto max-w-[800px] px-5 py-[72px] md:px-10 md:py-[96px]">
      <h1 className="font-display text-[clamp(36px,5vw,48px)] font-semibold tracking-[-0.03em] leading-[1.1] text-fg">
        We built the room we wanted to practice in
      </h1>

      <p className="mt-5 text-[17px] leading-[1.65] text-muted max-w-[60ch]">
        Algorym started from a frustration: mock interviews over video calls, with shared screens and
        separate editors, never felt like the real thing. Practice needs a live partner, results that
        come back while you type, and a record you can review afterwards.
      </p>

      <p className="mt-4 text-[17px] leading-[1.65] text-muted max-w-[60ch]">
        So Algorym puts two people in the same editor, in real time. Code syncs on both sides, runs
        stream back with output and verdicts, and there is no screen share to lag behind. The
        interviewer watches the candidate work through the problem as it happens.
      </p>

      <h2 className="mt-[56px] font-display text-[28px] font-semibold tracking-[-0.02em] leading-[1.15] text-fg">
        How it works
      </h2>

      <div className="mt-5 grid gap-5">
        <div className="rounded-[8px] border border-border bg-surface p-5">
          <h3 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-fg">
            The host sets the stage
          </h3>
          <p className="mt-2 text-[15px] leading-[1.6] text-muted">
            Create a session, pick a question from the bank (or write your own), and share the
            invite link. The guest joins with a name and consent, no account required.
          </p>
        </div>

        <div className="rounded-[8px] border border-border bg-surface p-5">
          <h3 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-fg">
            Both code in the same editor
          </h3>
          <p className="mt-2 text-[15px] leading-[1.6] text-muted">
            Both sides edit the same files in real time: cursors and selections are visible to each
            other, and every run returns to the shared output panel with stdout, timing, and the
            verdict.
          </p>
        </div>

        <div className="rounded-[8px] border border-border bg-surface p-5">
          <h3 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-fg">
            Replay and evaluate
          </h3>
          <p className="mt-2 text-[15px] leading-[1.6] text-muted">
            After the session, the host opens a replay built from the event log: runs, code
            snapshots, and question changes on a scrubable timeline. The rating and notes are
            entered privately and never shown to the guest.
          </p>
        </div>
      </div>

      <h2 className="mt-[56px] font-display text-[28px] font-semibold tracking-[-0.02em] leading-[1.15] text-fg">
        What we believe
      </h2>

      <ul className="mt-5 grid gap-4">
        <li className="flex gap-3 text-[15px] leading-[1.6] text-muted">
          <span className="mt-2 h-[6px] w-[6px] shrink-0 rounded-full bg-accent opacity-80" />
          <span>
            <strong className="font-semibold text-fg">Practice should feel like the real thing.</strong>{' '}
            A mock interview only helps when it resembles the real one, so Algorym keeps the room
            live: shared editor, both cursors, verdicts that arrive while you are still solving.
          </span>
        </li>
        <li className="flex gap-3 text-[15px] leading-[1.6] text-muted">
          <span className="mt-2 h-[6px] w-[6px] shrink-0 rounded-full bg-accent opacity-80" />
          <span>
            <strong className="font-semibold text-fg">The code is the record.</strong>{' '}
            We persist code snapshots and run results. Chat and presence stay out of the replay,
            which shows how the code evolved and whether each run worked.
          </span>
        </li>
        <li className="flex gap-3 text-[15px] leading-[1.6] text-muted">
          <span className="mt-2 h-[6px] w-[6px] shrink-0 rounded-full bg-accent opacity-80" />
          <span>
            <strong className="font-semibold text-fg">Evaluation stays human.</strong>{' '}
            Algorym does not auto-grade anything. The interviewer sees the false starts, the
            refactors, and the edge cases, then makes the call.
          </span>
        </li>
        <li className="flex gap-3 text-[15px] leading-[1.6] text-muted">
          <span className="mt-2 h-[6px] w-[6px] shrink-0 rounded-full bg-accent opacity-80" />
          <span>
            <strong className="font-semibold text-fg">The guest path stays short.</strong>{' '}
            A candidate joins with one link: name, consent, enter. No sign-up, no email
            verification, no download.
          </span>
        </li>
      </ul>

      <div className="mt-[56px] rounded-[12px] border border-border bg-surface p-6">
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-fg">
          Why it exists
        </h2>
        <p className="mt-3 text-[15px] leading-[1.6] text-muted">
          Algorym started as a way to rehearse technical interviews with a real partner instead of
          a whiteboard. It stuck because building it turned out to be genuinely fun.
        </p>
      </div>

      <div className="mt-[56px] flex flex-wrap gap-4">
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-[6px] border border-border-strong bg-surface px-4 py-2 text-[13px] font-semibold tracking-[0.02em] text-fg transition-all duration-[120ms] ease-default hover:bg-surface-2"
        >
          Get in touch
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-[6px] bg-accent px-4 py-2 text-[13px] font-semibold tracking-[0.02em] text-on-accent transition-all duration-[120ms] ease-default hover:bg-accent-hover"
        >
          Try Algorym
        </Link>
      </div>
    </div>
  )
}
