import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Obtener el elemento raíz del DOM
const rootElement = document.getElementById('root')

// Verificar que existe (TypeScript guard)
if (!rootElement) {
  throw new Error('No se encontró el elemento #root en el HTML. Verificar index.html.')
}

// Renderizar la aplicación en modo estricto
// StrictMode ayuda a detectar efectos secundarios en desarrollo
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
