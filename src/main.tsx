import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './context/AppContext'
import './styles.css'
import './features.css'
import './pages.css'
import './typography.css'
import './upgrade.css'

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><AppProvider><App/></AppProvider></BrowserRouter></StrictMode>)
