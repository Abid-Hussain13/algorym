import { Hero } from '@/components/marketing/Hero'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { EditorShowcase } from '@/components/marketing/EditorShowcase'
import { Roles } from '@/components/marketing/Roles'
import { ReplaySection } from '@/components/marketing/ReplaySection'
import { CTASection } from '@/components/marketing/CTASection'
import { FaqSection } from '@/components/marketing/FaqSection'

export function HomePage() {
    return (
        <>
            <Hero />
            <EditorShowcase />
            <HowItWorks />
            <Roles />
            <ReplaySection />
            <FaqSection />
            <CTASection />
        </>
    )
}
