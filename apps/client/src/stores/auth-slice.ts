import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'

import { authApi } from '@/lib/api'

import type { User } from '@algorym/shared-types'

type UserSafe = Omit<User, 'password_hash'>

interface AuthState {
  user: UserSafe | null
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  error: string | null
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
}

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const { user } = await authApi.login({ email, password })
    return user
  },
)

export const signupThunk = createAsyncThunk(
  'auth/signup',
  async ({ name, email, password }: { name: string; email: string; password: string }) => {
    const { user } = await authApi.signup({ name, email, password })
    return user
  },
)

export const loadMeThunk = createAsyncThunk('auth/loadMe', async () => {
  const user = await authApi.me()
  return user
})

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.status = 'unauthenticated'
      state.error = null
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action: PayloadAction<UserSafe>) => {
        state.user = action.payload
        state.status = 'authenticated'
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'unauthenticated'
        state.error = action.error.message ?? 'Login failed'
      })
      .addCase(signupThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(signupThunk.fulfilled, (state, action: PayloadAction<UserSafe>) => {
        state.user = action.payload
        state.status = 'authenticated'
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.status = 'unauthenticated'
        state.error = action.error.message ?? 'Signup failed'
      })
      .addCase(loadMeThunk.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(loadMeThunk.fulfilled, (state, action: PayloadAction<UserSafe>) => {
        state.user = action.payload
        state.status = 'authenticated'
      })
      .addCase(loadMeThunk.rejected, (state) => {
        state.user = null
        state.status = 'unauthenticated'
      })
  },
})

export const { logout, clearAuthError } = authSlice.actions

interface AuthRootState {
  auth: AuthState
}

export const selectUser = (state: AuthRootState): UserSafe | null =>
  state.auth.user
export const selectAuthStatus = (state: AuthRootState): AuthState['status'] =>
  state.auth.status
export const selectAuthError = (state: AuthRootState): string | null =>
  state.auth.error