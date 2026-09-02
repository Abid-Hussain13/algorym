import { Navigate, Route, Routes } from 'react-router-dom'

import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { MarketingLayout } from '@/app/layouts/MarketingLayout'
import { LiveLayout } from '@/app/layouts/LiveLayout'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { SessionDetailPage } from '@/pages/dashboard/SessionDetailPage'
import { LiveRoomPage } from '@/pages/live/LiveRoomPage'
import { AboutPage } from '@/pages/marketing/AboutPage'
import { ContactPage } from '@/pages/marketing/ContactPage'
import { HomePage } from '@/pages/marketing/HomePage'
import { LegalPage } from '@/pages/marketing/LegalPage'
import { PricingPage } from '@/pages/marketing/PricingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function AppRouter() {
    return (
        <Routes>
            <Route element={<MarketingLayout />}>
                <Route index element={<HomePage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="pricing" element={<PricingPage />} />
                <Route path="terms" element={<LegalPage variant="terms" />} />
                <Route path="privacy" element={<LegalPage variant="privacy" />} />
            </Route>


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
