import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <div className="mx-auto max-w-[800px] px-5 py-[72px] md:px-10 md:py-[96px]">
      <h1 className="font-display text-[clamp(36px,5vw,48px)] font-semibold tracking-[-0.03em] leading-[1.1] text-fg">
        We built the room we wanted to practice in
      </h1>

      <p className="mt-5 text-[17px] leading-[1.65] text-muted max-w-[60ch]">
        Algorym started from a frustration: mock interviews over video calls with shared screens
        and disconnected editors never felt like the real thing. You need the pressure of a live
        environment, the feedback of a shared terminal, and a replay you can study after.
      </p>

      <p className="mt-4 text-[17px] leading-[1.65] text-muted max-w-[60ch]">
        We built a tool that puts two people in the same codebase, in real time, with run results
        streaming in as code is written. No screen-sharing lag, no "can you see my cursor?" — just
        a focused room where the interviewer watches the candidate think through a problem.
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
            invite link. The guest joins with a name and consent — no account required.
          </p>
        </div>

        <div className="rounded-[8px] border border-border bg-surface p-5">
          <h3 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-fg">
            Both code in the same editor
          </h3>
          <p className="mt-2 text-[15px] leading-[1.6] text-muted">
            The guest writes code while the host watches in real time — cursors visible,
            selections visible, every keystroke part of the evaluation. Run your code and see
            results instantly in the shared terminal.
          </p>
        </div>

        <div className="rounded-[8px] border border-border bg-surface p-5">
          <h3 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-fg">
            Replay and evaluate
          </h3>
          <p className="mt-2 text-[15px] leading-[1.6] text-muted">
            After the session, the host watches a full replay — every code change, every run
            result, on a scrubable timeline. Rate the candidate privately, add notes, and build
            a real picture of how they think under pressure.
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
            The closer your mock interview is to the actual experience, the more prepared
            you'll be. Algorym doesn't abstract away the pressure — it simulates it.
          </span>
        </li>
        <li className="flex gap-3 text-[15px] leading-[1.6] text-muted">
          <span className="mt-2 h-[6px] w-[6px] shrink-0 rounded-full bg-accent opacity-80" />
          <span>
            <strong className="font-semibold text-fg">Code is the artifact, not the transcript.</strong>{' '}
            We persist code snapshots and run results — not chat logs or join/leave events.
            The replay shows what matters: how the code evolved and whether it worked.
          </span>
        </li>
        <li className="flex gap-3 text-[15px] leading-[1.6] text-muted">
          <span className="mt-2 h-[6px] w-[6px] shrink-0 rounded-full bg-accent opacity-80" />
          <span>
            <strong className="font-semibold text-fg">Evaluation is human, not algorithmic.</strong>{' '}
            Algorym doesn't auto-grade your solution. The interviewer sees the full picture —
            false starts, refactors, edge case handling — and makes a judgment call.
          </span>
        </li>
        <li className="flex gap-3 text-[15px] leading-[1.6] text-muted">
          <span className="mt-2 h-[6px] w-[6px] shrink-0 rounded-full bg-accent opacity-80" />
          <span>
            <strong className="font-semibold text-fg">Guest friction should be zero.</strong>{' '}
            A candidate joins with one link. Name, consent, enter. No sign-up wall, no email
            verification, no download. The interview starts in seconds.
          </span>
        </li>
      </ul>

      <div className="mt-[56px] rounded-[12px] border border-border bg-surface p-6">
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-fg">
          Built by engineers who've been on both sides
        </h2>
        <p className="mt-3 text-[15px] leading-[1.6] text-muted">
          We've interviewed at dozens of companies and conducted hundreds of technical screens.
          We've seen what works — focused environments with real problems — and what doesn't —
          whiteboard hazing and LeetCode grinding with no feedback loop. Algorym is the tool
          we wish existed when we started interviewing.
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
