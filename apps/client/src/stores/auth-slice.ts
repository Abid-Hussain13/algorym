import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from '@reduxjs/toolkit'

import { authApi, ApiError } from '@/lib/api'

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
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        try {
            return await authApi.login({ email, password })
        } catch (e) {
            if (e instanceof ApiError) return rejectWithValue(e)
            throw e
        }
    },
)

export const signupThunk = createAsyncThunk(
    'auth/signup',
    async ({ name, email, password }: { name: string; email: string; password: string }, { rejectWithValue }) => {
        try {
            return await authApi.signup({ name, email, password })
        } catch (e) {
            if (e instanceof ApiError) return rejectWithValue(e)
            throw e
        }
    },
)

export const loadMeThunk = createAsyncThunk('auth/loadMe', async () => {
    const user = await authApi.me()
    return user
})

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
    const logout = await authApi.logout();
    return logout;
})

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
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
            .addCase(logoutThunk.pending, (state) => {
                state.status = 'loading'
            })
            .addCase(logoutThunk.fulfilled, (state) => {
                state.user = null
                state.status = 'unauthenticated'
                state.error = null
            })
            .addCase(logoutThunk.rejected, (state) => {
                state.user = null
                state.status = 'unauthenticated'
                state.error = null
            })
    },
})

export const { clearAuthError } = authSlice.actions

interface AuthRootState {
    auth: AuthState
}

export const selectUser = (state: AuthRootState): UserSafe | null =>
    state.auth.user
export const selectAuthStatus = (state: AuthRootState): AuthState['status'] =>
    state.auth.status
export const selectAuthError = (state: AuthRootState): string | null =>
    state.auth.error
