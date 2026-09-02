import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AppRouter } from './router'
import { ScrollToTop } from './ScrollToTop'
import { store, useAppDispatch, loadMeThunk } from '@/stores'

function AuthLoader() {
    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(loadMeThunk())
    }, [dispatch])

    return null
}

export function App() {
    return (
        <Provider store={store}>
            <BrowserRouter>
                <AuthLoader />
                <ScrollToTop />
                <AppRouter />
                <Toaster position="top-right" richColors />
            </BrowserRouter>
        </Provider>
    )
}
