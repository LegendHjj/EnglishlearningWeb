import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AppRouter from './components/AppRouter'
import { AppProvider } from './context/AppContext'
import './styles.css'
import './features.css'
import './pages.css'
import './typography.css'
import './upgrade.css'

createRoot(document.getElementById('root')!).render(<StrictMode><AppRouter><AppProvider><App/></AppProvider></AppRouter></StrictMode>)
