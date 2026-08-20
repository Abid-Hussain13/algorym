import { Outlet } from 'react-router-dom'

import { Footer } from '@/components/marketing/Footer'
import { Navbar } from '@/components/shared/Navbar'

export function MarketingLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-bg text-fg">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}