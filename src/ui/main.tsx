import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/ui/App'

const plugin = document.getElementById('plugin') as HTMLElement

createRoot(plugin).render(
  <StrictMode>
    <App />
  </StrictMode>
)
