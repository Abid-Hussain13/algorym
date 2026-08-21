import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { Spinner } from '@/components/ui/Spinner'

export function DashboardLayout() {
  return (
    <div className="flex h-svh bg-bg text-fg">
      <main className="flex-1 overflow-y-auto">
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
    </div>
  )
}