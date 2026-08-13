import { Navigate, Route, Routes } from 'react-router-dom'

import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { MarketingLayout } from '@/app/layouts/MarketingLayout'
import { LiveLayout } from '@/app/layouts/LiveLayout'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { SessionDetailPage } from '@/pages/dashboard/SessionDetailPage'
import { JoinPage } from '@/pages/guest/JoinPage'
import { LiveRoomPage } from '@/pages/live/LiveRoomPage'
import { HomePage } from '@/pages/marketing/HomePage'
import { LegalPage } from '@/pages/marketing/LegalPage'
import { PricingPage } from '@/pages/marketing/PricingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route index element={<HomePage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="terms" element={<LegalPage variant="terms" />} />
        <Route path="privacy" element={<LegalPage variant="privacy" />} />
      </Route>

      <Route path="join/:token" element={<JoinPage />} />

      <Route element={<DashboardLayout />}>
        <Route path="app" element={<DashboardPage />} />
        <Route path="app/sessions/:sessionId" element={<SessionDetailPage />} />
      </Route>

      <Route path="live" element={<LiveLayout />}>
        <Route index element={<Navigate to="/app" replace />} />
        <Route path=":sessionId" element={<LiveRoomPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}