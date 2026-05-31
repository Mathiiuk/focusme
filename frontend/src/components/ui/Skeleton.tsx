import React from 'react'

// -------------------------------------------------------
// Skeleton — componente de carga que reduce ansiedad
// Los skeletons comunican "algo está llegando" sin el estrés
// de un spinner girando. Importante para usuarios con ansiedad.
// -------------------------------------------------------

interface SkeletonProps {
  /** Ancho del skeleton (Tailwind class o valor) */
  className?: string
  /** Variante visual */
  variant?: 'text' | 'circle' | 'card'
}

/**
 * Bloque de skeleton individual.
 * Usa la clase .skeleton de index.css que ya respeta prefers-reduced-motion.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
}) => {
  // Clases base según la variante
  const variantClasses = {
    text: 'h-4 rounded-lg',           // línea de texto
    circle: 'rounded-full',           // avatar o ícono
    card: 'h-24 rounded-xl',          // tarjeta completa
  }

  return (
    <div
      // La clase .skeleton aplica el gradiente animado definido en index.css
      className={`skeleton ${variantClasses[variant]} ${className}`}
      // Comunicar al lector de pantalla que hay contenido cargando
      role="status"
      aria-label="Cargando..."
    >
      {/* Texto invisible para lectores de pantalla */}
      <span className="sr-only">Cargando contenido...</span>
    </div>
  )
}

// -------------------------------------------------------
// TaskSkeleton — versión específica para el dashboard
// Simula la forma de una ActionCard mientras carga
// -------------------------------------------------------
export const TaskSkeleton: React.FC = () => (
  <div className="surface p-5 space-y-4" role="status" aria-label="Cargando objetivo...">
    {/* Simula el título del objetivo */}
    <Skeleton className="w-3/4" />
    {/* Simula el subtítulo */}
    <Skeleton className="w-1/2" />
    {/* Simula el card de la acción actual */}
    <Skeleton variant="card" className="mt-4" />
    {/* Simula los botones de acción */}
    <div className="flex gap-3 mt-4">
      <Skeleton className="h-11 flex-1 rounded-lg" />
      <Skeleton className="h-11 flex-1 rounded-lg" />
    </div>
    <span className="sr-only">Analizando tu objetivo, un momento...</span>
  </div>
)

// -------------------------------------------------------
// DashboardSkeleton — para la carga inicial de la página
// -------------------------------------------------------
export const DashboardSkeleton: React.FC = () => (
  <div className="w-full max-w-lg space-y-6" role="status" aria-label="Cargando dashboard...">
    {/* Simula el header con logo */}
    <div className="text-center space-y-3">
      <Skeleton variant="circle" className="w-10 h-10 mx-auto" />
      <Skeleton className="w-32 mx-auto" />
      <Skeleton className="w-48 mx-auto" />
    </div>
    {/* Simula el input principal */}
    <div className="surface p-5 space-y-4">
      <Skeleton className="w-24" />
      <Skeleton variant="card" className="h-28" />
      <Skeleton className="h-11 rounded-lg" />
    </div>
    <span className="sr-only">Preparando tu espacio de trabajo...</span>
  </div>
)
