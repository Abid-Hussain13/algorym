import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '@/lib/api/endpoints'
import type { CreateSessionBody } from '@algorym/shared-types'

export function useCreateSession() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (body: CreateSessionBody) => sessionsApi.create(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            queryClient.invalidateQueries({ queryKey: ['scheduledSession'] })
        },
    })
}

export function useUpdateSession() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, body }: { id: string; body: Partial<CreateSessionBody> }) =>
            sessionsApi.update(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            queryClient.invalidateQueries({ queryKey: ['scheduledSession'] })
        },
    })
}

export function useDeleteSession() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => sessionsApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            queryClient.invalidateQueries({ queryKey: ['scheduledSession'] })
        },
    })
}
