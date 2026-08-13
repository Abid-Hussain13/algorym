import { useCallback } from 'react'

import { clearAuthError, loginThunk, logout, signupThunk } from '@/stores/auth-slice'
import { selectAuthError, selectAuthStatus, selectUser } from '@/stores/auth-slice'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'

export function useAuth() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectUser)
  const status = useAppSelector(selectAuthStatus)
  const error = useAppSelector(selectAuthError)

  const login = useCallback(
    (email: string, password: string) => {
      dispatch(loginThunk({ email, password }))
    },
    [dispatch],
  )

  const signup = useCallback(
    (name: string, email: string, password: string) => {
      dispatch(signupThunk({ name, email, password }))
    },
    [dispatch],
  )

  const handleLogout = useCallback(() => {
    dispatch(logout())
  }, [dispatch])

  const clearError = useCallback(() => {
    dispatch(clearAuthError())
  }, [dispatch])

  return { user, status, error, login, signup, logout: handleLogout, clearError }
}