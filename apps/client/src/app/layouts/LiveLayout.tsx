import { Outlet } from 'react-router-dom'

export function LiveLayout() {
  return (
    <div className="h-svh overflow-hidden bg-bg text-fg">
      <Outlet />
    </div>
  )
}