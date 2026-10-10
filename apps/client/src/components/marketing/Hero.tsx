import { Button } from '@/components/ui/Button'
import { HeroStage } from '@/components/marketing/HeroStage'
import { Link } from 'react-router-dom'

export function Hero() {
    return (
        <header className="relative mx-auto flex max-w-[1200px] items-center justify-between gap-10 flex-col px-5 pt-[56px] pb-[64px] md:px-10 md:pt-[80px] md:pb-[88px] lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-10 lg:pt-[96px] lg:pb-[120px]">
            <div className="relative z-[1] min-w-0 max-w-[520px] flex-1 max-xl:max-w-[520px] max-xl:text-center">
                <h1 className="animate-rise max-w-[15ch] font-display font-semibold leading-[1.04] tracking-[-0.03em] text-[clamp(38px,4.5vw,64px)] [animation-delay:60ms] max-xl:max-w-none max-lg:text-[38px] max-lg:tracking-[-0.028em] max-sm:text-[32px] max-sm:tracking-[-0.022em] min-[1600px]:text-[72px] min-[2400px]:text-[84px]">
                    Interviews that run{' '}
                    <span className="text-accent">
                        live<span className="inline-block -ml-[0.3em] animate-caret-blink font-mono font-medium text-accent" aria-hidden="true">|</span>
                    </span>
                </h1>
                <p className="animate-rise mt-4 max-w-[40ch] text-lg leading-[1.55] text-muted [animation-delay:140ms] max-xl:mx-auto max-lg:text-base min-[1600px]:text-[19px]">
                    The interview you've been putting off. Rehearse it with a real partner, live, until you walk
                    in ready.
                </p>
                <div className="animate-rise mt-6 flex flex-wrap items-center gap-3 [animation-delay:220ms] max-xl:justify-center max-sm:flex-col max-sm:items-stretch">
                    <Button variant="primary" size="lg" className="max-sm:w-full max-sm:justify-center" asChild>
                        <Link to="/app">Get Started →</Link>
                    </Button>
                    <Button variant="ghost" size="lg" className="max-sm:w-full max-sm:justify-center" asChild>
                        <a href="#how-it-works">See how it works</a>
                    </Button>
                </div>
            </div>

            <HeroStage />
        </header>
    )
}
