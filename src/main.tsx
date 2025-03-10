import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Router from './routes/Router'
import { AuthProvider } from './context/AuthContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Router />
    </AuthProvider>
  </StrictMode>,
)
