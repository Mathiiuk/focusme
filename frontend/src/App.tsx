import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores'

// Importar páginas de forma lazy para reducir el bundle inicial
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'))
const AdhdModePage = React.lazy(() => import('@/pages/AdhdModePage'))
const AuthPage = React.lazy(() => import('@/pages/AuthPage'))

// -------------------------------------------------------
// Configuración de React Query
// -------------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reintentar solo una vez en caso de error
      retry: 1,
      // Refetch al volver a enfocar la ventana
      refetchOnWindowFocus: false,
      // Cache de 5 minutos
      staleTime: 5 * 60 * 1000,
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
// Componente raíz de la aplicación
// -------------------------------------------------------
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Skip navigation link para teclado — accesibilidad WCAG 2.4.1 */}
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

        <React.Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Ruta de autenticación — accesible sin login */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Ruta principal protegida */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Modo TDAH — protegido */}
            <Route
              path="/focus"
              element={
                <ProtectedRoute>
                  <AdhdModePage />
                </ProtectedRoute>
              }
            />

            {/* Cualquier ruta no encontrada redirige al inicio */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
