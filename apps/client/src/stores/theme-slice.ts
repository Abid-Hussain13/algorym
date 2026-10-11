import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'algorym-theme'

function getInitialTheme(): Theme {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'light' || saved === 'dark') return saved
    } catch {
        /* noop */
    }
    // Nothing stored yet: follow the OS instead of always flashing light mode
    // at people whose system theme is dark.
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark'
    }
    return 'light'
}

interface ThemeState {
    theme: Theme
}

const initialState: ThemeState = {
    theme: getInitialTheme(),
}

export const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setTheme(state, action: PayloadAction<Theme>) {
            state.theme = action.payload
        },
        toggleTheme(state) {
            state.theme = state.theme === 'light' ? 'dark' : 'light'
        },
    },
})

export const { setTheme, toggleTheme } = themeSlice.actions

export const selectTheme = (state: { theme: ThemeState }): Theme =>
    state.theme.theme
