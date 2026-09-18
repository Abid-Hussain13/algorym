import { useQuery } from '@tanstack/react-query'
import { questionsApi } from '@/lib/api'
import type { QuestionListParams } from '@algorym/shared-types'

export function useQuestions(params?: QuestionListParams) {
    return useQuery({
        queryKey: ['questions', params],
        queryFn: () => questionsApi.list(params),
    })
}
