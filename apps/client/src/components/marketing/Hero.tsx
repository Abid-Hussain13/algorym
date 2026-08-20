import { Button } from '@/components/ui/Button'
import { HeroStage } from '@/components/marketing/HeroStage'

export function Hero() {
    return (
        <header className="relative mx-auto flex max-w-[1200px] items-center justify-between gap-10 px-10 pt-[96px] pb-[120px] max-[1024px]:flex-col max-[1024px]:justify-center max-[1024px]:gap-8 max-[1024px]:px-7 max-[1024px]:pb-[96px] max-[1024px]:pt-[72px] max-[480px]:px-5 max-[480px]:pb-[96px] max-[480px]:pt-[72px]">
            <div className="relative z-[1] min-w-0 max-w-[520px] flex-1 max-[1024px]:max-w-[520px] max-[1024px]:text-center">
                <h1 className="animate-rise max-w-[15ch] font-display font-semibold leading-[1.04] tracking-[-0.03em] text-[clamp(38px,4.5vw,64px)] [animation-delay:60ms] max-[1024px]:max-w-none max-[768px]:text-[38px] max-[768px]:tracking-[-0.028em] max-[480px]:text-[32px] max-[480px]:tracking-[-0.022em] min-[1600px]:text-[72px] min-[2400px]:text-[84px]">
                    Interviews that run{' '}
                    <span className="text-accent">
                        live<span className="inline-block -ml-[0.3em] animate-caret-blink font-mono font-medium text-accent" aria-hidden="true">|</span>
                    </span>
                </h1>
                <p className="animate-rise mt-4 max-w-[40ch] text-lg leading-[1.55] text-muted [animation-delay:140ms] max-[1024px]:mx-auto max-[768px]:text-base min-[1600px]:text-[19px]">
                    The interview you've been putting off. Rehearse it with a real partner, live, until you walk
                    in ready.
                </p>
                <div className="animate-rise mt-6 flex flex-wrap items-center gap-3 [animation-delay:220ms] max-[1024px]:justify-center max-[480px]:flex-col max-[480px]:items-stretch">
                    <Button variant="primary" size="lg" className="max-[480px]:w-full max-[480px]:justify-center">
                        Get started
                        <span className="font-mono text-[0.95em]" aria-hidden="true">
                            →
                        </span>
                    </Button>
                    <Button variant="ghost" size="lg" className="max-[480px]:w-full max-[480px]:justify-center">
                        See how it works
                    </Button>
                </div>
            </div>

            <HeroStage />
        </header>
    )
}
