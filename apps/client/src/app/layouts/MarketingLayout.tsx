import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { Footer } from '@/components/marketing/Footer'
import { Navbar } from '@/components/shared/Navbar'
import { Spinner } from '@/components/ui/Spinner'

export function MarketingLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-bg text-fg">
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="grid min-h-[50vh] place-items-center">
              <Spinner size="lg" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}