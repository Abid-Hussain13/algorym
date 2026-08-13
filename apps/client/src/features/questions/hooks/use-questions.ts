import { useEffect, useState } from 'react'

import { questionsApi } from '@/lib/api'

import type { Question } from '@algorym/shared-types'

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    questionsApi
      .list()
      .then((data) => {
        if (!cancelled) setQuestions(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load questions')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { questions, loading, error }
}