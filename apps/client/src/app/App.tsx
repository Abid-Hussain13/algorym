import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AppRouter } from './router'
import { ScrollToTop } from './ScrollToTop'
import { store } from '@/stores/store'

export function App() {
    return (
        <Provider store={store}>
            <BrowserRouter>
                <ScrollToTop />
                <AppRouter />
                <Toaster position="top-right" richColors />
            </BrowserRouter>
        </Provider>
    )
}
