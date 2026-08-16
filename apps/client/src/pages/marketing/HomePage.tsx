import { Hero } from '@/components/marketing/Hero'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { EditorShowcase } from '@/components/marketing/EditorShowcase'

export function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <EditorShowcase />
    </>
  )
}