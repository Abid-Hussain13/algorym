import { questionsApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export function useQuestions() {

    return useQuery({
        queryKey: ["questions"],
        queryFn: () => questionsApi.list(),
    })
}
