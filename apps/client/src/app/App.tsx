import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import { AppRouter } from './router'
import { ScrollToTop } from './ScrollToTop'
import { store } from '@/stores/store'

export function App() {
    return (
        <Provider store={store}>
            <BrowserRouter>
                <ScrollToTop />
                <AppRouter />
            </BrowserRouter>
        </Provider>
    )
}
