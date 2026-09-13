import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '@/lib/api/endpoints'

export function useDeleteSession() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => sessionsApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}
