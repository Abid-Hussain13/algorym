import { Outlet } from 'react-router-dom'

export function DashboardLayout() {
  return (
    <div className="flex h-svh bg-bg text-fg">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}