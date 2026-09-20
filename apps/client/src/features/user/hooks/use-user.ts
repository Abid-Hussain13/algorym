import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '@/lib/api/endpoints'
import type { UpdatePreferencesBody, ChangePasswordBody } from '@algorym/shared-types'

export function useUserPreferences() {
    return useQuery({
        queryKey: ['user', 'preferences'],
        queryFn: () => userApi.getPreferences(),
    })
}

export function useUpdatePreferences() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (body: UpdatePreferencesBody) => userApi.updatePreferences(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] })
        },
    })
}

export function useChangePassword() {
    return useMutation({
        mutationFn: (body: ChangePasswordBody) => userApi.changePassword(body),
    })
}

export function useDeleteAccount() {
    return useMutation({
        mutationFn: () => userApi.deleteAccount(),
    })
}
