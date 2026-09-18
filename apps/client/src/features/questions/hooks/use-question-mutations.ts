import { useMutation, useQueryClient } from '@tanstack/react-query'
import { questionsApi } from '@/lib/api/endpoints'
import type { CreateQuestionBody } from '@algorym/shared-types'

export function useCreateQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (body: CreateQuestionBody) => questionsApi.create(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] })
        },
    })
}

export function useUpdateQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, body }: { id: string; body: CreateQuestionBody }) =>
            questionsApi.update(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] })
        },
    })
}

export function useDeleteQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => questionsApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] })
        },
    })
}
