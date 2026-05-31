import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { goalService } from '@/services/api'
import type { Goal } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, Pause, Archive, Filter } from 'lucide-react'

// -------------------------------------------------------
// Mapeo de estado a badge visual
// Cada estado tiene un ícono, color y label en español
// -------------------------------------------------------
const STATUS_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  ACTIVE:    { icon: Clock,       label: 'Activo',     color: 'text-blue-600',   bg: 'bg-blue-100' },
  COMPLETED: { icon: CheckCircle, label: 'Completado', color: 'text-green-600',  bg: 'bg-green-100' },
  PAUSED:    { icon: Pause,       label: 'Pausado',    color: 'text-yellow-600', bg: 'bg-yellow-100' },
  ARCHIVED:  { icon: Archive,     label: 'Archivado',  color: 'text-gray-500',   bg: 'bg-gray-100' },
}

// -------------------------------------------------------
// Filtros disponibles para la vista
// -------------------------------------------------------
const FILTERS = ['Todos', 'Activos', 'Completados'] as const
type FilterType = typeof FILTERS[number]

const filterToStatus: Record<FilterType, string | null> = {
  'Todos': null,
  'Activos': 'ACTIVE',
  'Completados': 'COMPLETED',
}

// -------------------------------------------------------
// TimelinePage: vista cronológica de todos los objetivos
// -------------------------------------------------------
const TimelinePage: React.FC = () => {
  // Estado local para almacenar el filtro seleccionado en la pestaña de navegación
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todos')

  // Obtener la lista de todos los objetivos del usuario desde el servidor utilizando React Query
  const { data: goals = [], isLoading: loading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalService.getAll(),
  })

  // Calcular progreso de un objetivo (subtareas completadas / total)
  // Devuelve la cantidad de pasos completados y el total de pasos del objetivo
  const getProgress = (goal: Goal) => {
    // Aplanamos todas las subtareas asociadas a las tareas del objetivo
    const allSubtasks = goal.tasks?.flatMap(t => t.subtasks) ?? []
    // Filtramos para contar las subtareas que tienen estado completado
    const completed = allSubtasks.filter(s => s.status === 'COMPLETED').length
    // Retornamos el conteo de completadas y el total de subtareas
    return { completed, total: allSubtasks.length }
  }

  // Determinar si un objetivo está completado por completo
  // Un objetivo está completado si su estado en DB es COMPLETED, o si tiene al menos una tarea y todos sus pasos están completados
  const isGoalCompleted = (goal: Goal) => {
    // Si el estado en la base de datos ya es COMPLETED, se considera completado
    if (goal.status === 'COMPLETED') return true
    // Si no, verificamos el progreso en tiempo real de sus subtareas
    const { completed, total } = getProgress(goal)
    // Se considera completado si hay pasos totales y todos están listos
    return total > 0 && completed === total
  }

  // Filtrar objetivos según el filtro activo de forma inteligente y TDAH-friendly
  const filteredGoals = goals.filter(g => {
    if (activeFilter === 'Activos') {
      // Excluir cualquier objetivo que esté completado (estado o 100% de progreso) de la pestaña de activos
      return !isGoalCompleted(g)
    }
    if (activeFilter === 'Completados') {
      // Incluir solo objetivos completados (estado o 100% de progreso) en la pestaña de completados
      return isGoalCompleted(g)
    }
    // "Todos" muestra la lista completa de objetivos sin restricciones
    return true
  })

  // Si los datos aún se están cargando, mostrar una pantalla limpia con un mensaje amigable
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)]">Cargando tus objetivos...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header de la página con título y descripción */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mis Objetivos</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Tu recorrido en FocusFlow. Cada paso cuenta, sin importar el ritmo.
        </p>
      </div>

      {/* Selector de filtros de pestañas */}
      <div className="flex items-center gap-2 mb-6" role="tablist" aria-label="Filtrar objetivos">
        <Filter size={16} className="text-[var(--color-text-disabled)]" aria-hidden="true" />
        {FILTERS.map(filter => (
          <button
            key={filter}
            role="tab"
            aria-selected={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
              activeFilter === filter
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Lista de tarjetas de objetivos filtrados o vista de estado vacío */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4" aria-hidden="true">🌱</p>
          <p className="text-[var(--color-text-secondary)] text-lg">
            {activeFilter === 'Todos'
              ? 'No hay objetivos todavía. ¡Cuando estés listo, empezamos!'
              : `No hay objetivos ${activeFilter.toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Línea vertical decorativa del timeline */}
          <div
            className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--color-border)]"
            aria-hidden="true"
          />

          {/* Renderizado de las tarjetas con animación de Framer Motion */}
          <AnimatePresence>
            {filteredGoals.map((goal, index) => {
              // Calcular el progreso de pasos y el porcentaje para este objetivo
              const { completed, total } = getProgress(goal)
              // Porcentaje de progreso del objetivo
              const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0
              // Comprobar si el objetivo está completado
              const completedFlag = isGoalCompleted(goal)
              // Usar configuración de estilo completado (verde) si está completo, o la correspondiente a su estado actual
              const config = completedFlag ? STATUS_CONFIG.COMPLETED : (STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.ACTIVE)
              // Icono correspondiente al estado
              const StatusIcon = config.icon

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-10 pb-8 last:pb-0"
                >
                  {/* Punto en la línea del timeline: verde si está completado, azul de lo contrario */}
                  <div
                    className={`absolute left-2.5 top-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-bg-surface)] ${
                      completedFlag ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent)]'
                    }`}
                    aria-hidden="true"
                  />

                  {/* Tarjeta del objetivo */}
                  <article className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header: título + badge de estado */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-base font-semibold text-[var(--color-text-primary)] leading-snug flex-1">
                        {goal.title}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg} shrink-0`}>
                        <StatusIcon size={12} aria-hidden="true" />
                        {config.label}
                      </span>
                    </div>

                    {/* Descripción original (si existe) */}
                    {goal.description && (
                      <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                        {goal.description}
                      </p>
                    )}

                    {/* Barra de progreso del objetivo */}
                    {total > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                          <span>{completed} de {total} pasos</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div
                          className="h-2 w-full bg-[var(--color-bg-muted)] rounded-full overflow-hidden"
                          role="progressbar"
                          aria-valuenow={progressPercent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Progreso del objetivo: ${progressPercent}%`}
                        >
                          <motion.div
                            className={`h-full rounded-full ${
                              completedFlag ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent)]'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Fecha de creación o completado */}
                    <p className="text-xs text-[var(--color-text-disabled)]">
                      {goal.completedAt || completedFlag
                        ? `Completado el ${new Date(goal.completedAt || new Date()).toLocaleDateString('es-AR')}`
                        : `Creado el ${new Date(goal.createdAt).toLocaleDateString('es-AR')}`}
                    </p>
                  </article>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default TimelinePage
