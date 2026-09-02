import { useEffect, useState } from 'react'

import { sessionsApi } from '@/lib/api'

import type { Session } from '@algorym/shared-types'

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    sessionsApi
      .list()
      .then((data) => {
        if (!cancelled) setSessions(data.sessions)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load sessions')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { sessions, loading, error }
}