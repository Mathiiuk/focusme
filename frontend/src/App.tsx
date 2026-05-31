import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores'
import { AppShell } from '@/components/layout/AppShell'
import { ReloadPrompt } from '@/components/pwa/ReloadPrompt'

import DashboardPage from '@/pages/DashboardPage'
import ProgressPage from '@/pages/ProgressPage'
import TimelinePage from '@/pages/TimelinePage'
import ProfilePage from '@/pages/ProfilePage'
import LandingPage from '@/pages/LandingPage'

// Importar páginas de forma lazy solo para las que no son críticas (o pesadas)
const AdhdModePage = React.lazy(() => import('@/pages/AdhdModePage'))

// -------------------------------------------------------
// Configuración de React Query
// -------------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reintentar solo una vez en caso de error, excepto si es 401/403
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false
        return failureCount < 1
      },
      // Refetch al volver a enfocar la ventana
      refetchOnWindowFocus: false,
      // Cache de 2 minutos por defecto
      staleTime: 1000 * 60 * 2,
      // Tiempo antes de recolectar basura (10 mins)
      gcTime: 1000 * 60 * 10,
    },
  },
})

// -------------------------------------------------------
// Componente ProtectedRoute
// Redirige al login si el usuario no está autenticado
// -------------------------------------------------------
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }
  return <>{children}</>
}

// -------------------------------------------------------
// Componente de carga (Suspense fallback)
// Pantalla mínima mientras carga el chunk de la página
// -------------------------------------------------------
const LoadingScreen: React.FC = () => (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{ background: 'var(--color-bg-primary)' }}
    role="status"
    aria-label="Cargando..."
  >
    <div
      className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
      style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
      aria-hidden="true"
    />
  </div>
)

// -------------------------------------------------------
// Layout protegido con AppShell (header + navegación)
// -------------------------------------------------------
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <AppShell>{children}</AppShell>
  </ProtectedRoute>
)

// -------------------------------------------------------
// Componente raíz de la aplicación
// -------------------------------------------------------
function App() {
  // Leemos el estado de autenticación de forma reactiva desde el store de Zustand.
  // Si cambia, forzará el re-renderizado automático de las rutas.
  const { isAuthenticated } = useAuthStore()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Enlace de salto de navegación para accesibilidad por teclado */}
        <a
          href="#main-content"
          className={[
            'sr-only focus:not-sr-only',
            'focus:fixed focus:top-4 focus:left-4 focus:z-[100]',
            'focus:px-4 focus:py-2 focus:rounded-lg focus:text-white focus:text-[14px]',
            'focus:outline-none focus:ring-[3px] focus:ring-white',
          ].join(' ')}
          style={{ background: 'var(--color-accent)' }}
        >
          Ir al contenido principal
        </a>

        {/* Suspense maneja la carga perezosa de los bundles de las páginas hijas */}
        <React.Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Si el usuario está autenticado, la raíz muestra el Dashboard. Si no, muestra la LandingPage */}
            <Route 
              path="/" 
              element={
                isAuthenticated 
                  ? <ProtectedLayout><DashboardPage /></ProtectedLayout> 
                  : <LandingPage />
              } 
            />

            {/* Si el usuario intenta ir a /auth de forma manual, lo redirigimos a la raíz (que mostrará la landing o el dashboard según corresponda) */}
            <Route path="/auth" element={<Navigate to="/" replace />} />

            {/* Rutas protegidas para el resto de páginas de la aplicación */}
            <Route path="/focus" element={<ProtectedLayout><AdhdModePage /></ProtectedLayout>} />
            <Route path="/progress" element={<ProtectedLayout><ProgressPage /></ProtectedLayout>} />
            <Route path="/timeline" element={<ProtectedLayout><TimelinePage /></ProtectedLayout>} />
            <Route path="/profile" element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />

            {/* Cualquier ruta que no coincida con las anteriores se redirige a la raíz de forma segura */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
        
        {/* Notificador de actualización PWA para cargas sin conexión */}
        <ReloadPrompt />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
