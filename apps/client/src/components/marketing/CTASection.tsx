import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'

interface CTAProps {
    title?: string
    description?: string
    action?: {
        text: string
        href: string
    }
    className?: string
}

export function CTASection({
    title = 'Code together, live',
    description = 'Real-time algorithmic collaboration, watch solutions evolve as you pair program.',
    action = { text: 'Get started', href: '/app' },
    className,
}: CTAProps) {
    return (
        <section className={cn('relative pt-[48px] pb-[56px] md:pt-[96px] md:pb-[120px]', className)}>
            <div className="relative mx-auto flex aspect-[16/11] w-full max-w-[1120px] items-center justify-center overflow-hidden rounded-[18px] max-lg:aspect-[16/10] md:aspect-[16/7] md:rounded-[24px]">
                <img
                    src="/cta backgound.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0"
                >
                    <div className="absolute inset-x-0 bottom-0 h-[100px] bg-[radial-gradient(ellipse_at_center_bottom,var(--color-accent-soft)_0%,transparent_70%)]" />
                    <div className="absolute inset-y-0 left-0 w-[80px] bg-[radial-gradient(ellipse_at_left_center,var(--color-accent-soft)_0%,transparent_70%)]" />
                    <div className="absolute inset-y-0 right-0 w-[80px] bg-[radial-gradient(ellipse_at_right_center,var(--color-accent-soft)_0%,transparent_70%)]" />
                </div>
                <div className="relative z-10 mx-auto flex max-w-container -translate-y-5 flex-col items-center gap-2 px-5 text-center sm:-translate-y-8 sm:gap-3 sm:px-8 md:-translate-y-10">

                    <h2 className="text-[21px] font-semibold text-[#2b2a26] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] opacity-0 animate-fade-in-up delay-200 sm:text-3xl md:text-5xl">
                        {title}
                    </h2>

                    {description && (
                        <p className="text-[12.5px] leading-[1.5] text-[#6e6a60] drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] opacity-0 animate-fade-in-up delay-300 sm:text-sm md:text-base">
                            {description}
                        </p>
                    )}

                    <Button variant="primary" size="md" className="mt-3 opacity-0 animate-fade-in-up delay-500 sm:mt-6 md:mt-6" asChild>
                        <a href={action.href}>{action.text}</a>
                    </Button>
                </div>
            </div>
        </section>
    )
}
