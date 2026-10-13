import { Button } from '@/components/ui/Button'
import { HeroStage } from '@/components/marketing/HeroStage'
import { Link } from 'react-router-dom'

export function Hero() {
    return (
        <header className="relative mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-10 px-5 pb-[110px] pt-[100px] md:px-10 md:pb-[124px] md:pt-[112px] lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-10 lg:pb-[120px] lg:pt-[96px]">
            <div className="relative z-[1] w-full min-w-0 max-w-[520px] max-xl:text-center lg:max-w-[520px] lg:flex-1 lg:text-left">
                <h1 className="animate-rise max-w-[15ch] font-display text-[28px] font-semibold leading-[1.06] tracking-[-0.02em] [animation-delay:60ms] sm:text-[34px] md:text-[42px] lg:max-w-none lg:text-[clamp(38px,4.5vw,64px)] lg:tracking-[-0.03em] min-[1600px]:text-[72px] min-[2400px]:text-[84px]">
                    Interviews that run{' '}
                    <span className="text-accent">
                        live<span className="-ml-[0.3em] inline-block animate-caret-blink font-mono text-[0.9em] font-medium text-accent" aria-hidden="true">|</span>
                    </span>
                </h1>
                <p className="animate-rise mt-3 max-w-[42ch] text-[14px] leading-[1.55] text-muted [animation-delay:140ms] sm:text-[15px] md:mt-4 md:text-base lg:text-lg min-[1600px]:text-[19px]">
                    The interview you&rsquo;ve been putting off. Rehearse it with a real partner, live, until you walk
                    in ready.
                </p>
                <div className="animate-rise mt-6 flex flex-nowrap items-center gap-2 [animation-delay:220ms] sm:mt-6 sm:gap-3">
                    <Button
                        variant="primary"
                        size="md"
                        className="px-4 py-2 text-[13px] whitespace-nowrap sm:px-5 sm:py-[11px] sm:text-sm"
                        asChild
                    >
                        <Link to="/app">Get Started →</Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="md"
                        className="px-4 py-2 text-[13px] whitespace-nowrap sm:px-5 sm:py-[11px] sm:text-sm"
                        asChild
                    >
                        <a href="#how-it-works">See how it works</a>
                    </Button>
                </div>
            </div>

            <div className="hidden md:block">
                <HeroStage />
            </div>
        </header>
    )
}
