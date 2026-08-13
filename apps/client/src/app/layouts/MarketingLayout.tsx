import { Outlet } from 'react-router-dom'

export function MarketingLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-bg text-fg">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}