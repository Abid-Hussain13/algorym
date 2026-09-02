import { useState } from 'react'
import { IconMail } from '@/components/icons'

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="mx-auto max-w-[640px] px-5 py-[72px] md:px-10 md:py-[96px]">
      <h1 className="font-display text-[clamp(36px,5vw,48px)] font-semibold tracking-[-0.03em] leading-[1.1] text-fg">
        Contact us
      </h1>

      <p className="mt-4 text-[17px] leading-[1.65] text-muted max-w-[52ch]">
        Questions, feedback, partnership ideas, or just want to say hi? We read every message.
      </p>

      {submitted ? (
        <div className="mt-8 rounded-[12px] border border-border bg-surface p-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[12px] bg-accent-soft">
            <IconMail className="h-5 w-5 text-accent-text" />
          </div>
          <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-fg">
            Message sent
          </h2>
          <p className="mt-2 text-[15px] leading-[1.6] text-muted">
            We'll get back to you within a day or two. Thanks for reaching out.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-faint"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Your name"
              className="w-full rounded-[6px] border border-border-strong bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-faint transition-all duration-[120ms] ease-default focus:border-accent focus:shadow-[0_0_0_3px_var(--color-focus)] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-faint"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-[6px] border border-border-strong bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-faint transition-all duration-[120ms] ease-default focus:border-accent focus:shadow-[0_0_0_3px_var(--color-focus)] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="subject"
              className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-faint"
            >
              Subject
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              required
              placeholder="What's this about?"
              className="w-full rounded-[6px] border border-border-strong bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-faint transition-all duration-[120ms] ease-default focus:border-accent focus:shadow-[0_0_0_3px_var(--color-focus)] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-faint"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder="Tell us what's on your mind..."
              className="w-full rounded-[6px] border border-border-strong bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-faint transition-all duration-[120ms] ease-default focus:border-accent focus:shadow-[0_0_0_3px_var(--color-focus)] focus:outline-none resize-none"
            />
          </div>

          <div>
            <button
              type="submit"
              className="rounded-[6px] bg-accent px-4 py-2 text-[13px] font-semibold tracking-[0.02em] text-on-accent transition-all duration-[120ms] ease-default hover:bg-accent-hover active:translate-y-px active:bg-accent-active"
            >
              Send message
            </button>
          </div>
        </form>
      )}

      <div className="mt-[56px] rounded-[12px] border border-border bg-surface p-5">
        <h2 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-fg">
          Prefer email?
        </h2>
        <p className="mt-2 text-[15px] leading-[1.6] text-muted">
          You can reach us directly at{' '}
          <a
            href="mailto:abidhussainme1@gmail.com"
            className="text-accent-text transition-colors duration-[120ms] ease-default hover:text-fg"
          >
            abidhussainme1@gmail.com
          </a>
          . We typically respond within 24 hours.
        </p>
      </div>
    </div>
  )
}
