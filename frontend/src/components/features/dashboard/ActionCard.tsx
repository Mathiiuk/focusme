import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDrag } from '@use-gesture/react'
import { useMotion } from '@/hooks/useMotion'
import { CheckCircle, HelpCircle, ChevronDown, ChevronUp, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Goal, Subtask } from '@/types'
import clsx from 'clsx'

// -------------------------------------------------------
// Tipos del ActionCard
// -------------------------------------------------------
interface ActionCardProps {
  goal: Goal
  currentSubtask: Subtask | null
  onDone: () => void
  onNeedHelp: () => void
  onEnterAdhdMode: () => void
  isLoading?: boolean
}

// -------------------------------------------------------
// Mapa de complejidad a etiqueta visual suave
// No se muestra el número: solo un color y texto amigable
// -------------------------------------------------------
const COMPLEXITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Sencillo', color: 'var(--color-success)' },
  2: { label: 'Tranquilo', color: 'var(--color-success)' },
  3: { label: 'Manejable', color: 'var(--color-warning)' },
  4: { label: 'Desafiante', color: 'var(--color-warning)' },
  5: { label: 'Intenso', color: 'var(--color-error)' },
}

// -------------------------------------------------------
// Componente ActionCard
// Muestra el estado activo del dashboard: objetivo + acción actual
// -------------------------------------------------------
export const ActionCard: React.FC<ActionCardProps> = ({
  goal,
  currentSubtask,
  onDone,
  onNeedHelp,
  onEnterAdhdMode,
  isLoading = false,
}) => {
  // Estado: mostrar/ocultar información secundaria
  const [showDetails, setShowDetails] = useState(false)
  const { enterTransition, exitTransition, animate, transition } = useMotion()

  // Calcular progreso total de subtareas
  const allSubtasks = goal.tasks.flatMap((t) => t.subtasks)
  const completedCount = allSubtasks.filter((s) => s.status === 'COMPLETED').length
  const totalCount = allSubtasks.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Complejidad del objetivo
  const complexity = goal.clsScore
    ? Math.min(5, Math.ceil(goal.clsScore / 5))
    : null
  const complexityInfo = complexity ? COMPLEXITY_LABELS[complexity] : null

  // Swipe gesture for mobile (Problema 3)
  const bind = useDrag(({ movement: [mx], last }) => {
    if (last && mx > 80) {
      if (navigator.vibrate) navigator.vibrate(10)
      onDone()
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={animate || { opacity: 1, y: 0 }}
      transition={transition || enterTransition}
      className="w-full"
    >
      {/* Resumen del objetivo */}
      <div className="mb-4">
        <p className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
          Tu objetivo
        </p>
        <h2 className="text-[18px] font-semibold text-[var(--color-text-primary)] leading-snug">
          {goal.title}
        </h2>

        {/* Etiqueta de complejidad (color, sin número) */}
        {complexityInfo && (
          <span
            className="inline-block mt-2 text-[12px] px-2.5 py-1 rounded-full font-medium"
            style={{
              color: complexityInfo.color,
              background: `${complexityInfo.color}18`, // color con 10% opacidad
            }}
          >
            {complexityInfo.label}
          </span>
        )}
      </div>

      {/* Barra de progreso */}
      {totalCount > 0 && (
        <div className="mb-5" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`Progreso: ${completedCount} de ${totalCount} pasos completados`}>
          <div className="flex justify-between text-[12px] text-[var(--color-text-disabled)] mb-1.5">
            <span>{completedCount} de {totalCount} pasos</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--color-accent)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Tarjeta de la acción actual — la más importante de toda la pantalla */}
      {/* Usamos 'as any' para evitar la colisión del tipo 'onDrag' entre framer-motion y @use-gesture/react */}
      <motion.div 
        {...(bind() as any)} 
        className="surface p-5 mb-4 touch-action-none cursor-grab active:cursor-grabbing"
        whileDrag={{ scale: 0.98 }}
      >
        <div className="flex items-start gap-3">
          {/* Ícono de paso actual */}
          <div
            className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
            style={{ background: 'var(--color-accent-light)' }}
            aria-hidden="true"
          >
            <Zap size={16} style={{ color: 'var(--color-accent)' }} />
          </div>

          <div className="flex-1">
            <p className="text-[13px] text-[var(--color-text-secondary)] mb-1">
              El siguiente paso (desliza para completar)
            </p>
            {currentSubtask ? (
              <p className="text-[18px] font-medium text-[var(--color-text-primary)] leading-snug">
                {currentSubtask.title}
              </p>
            ) : (
              <p className="text-[18px] font-medium text-[var(--color-success)]">
                🎉 ¡Completaste todos los pasos!
              </p>
            )}

            {/* Tiempo estimado (si está disponible) */}
            {currentSubtask?.durationMinutes && (
              <div className="flex items-center gap-1.5 mt-2 text-[13px] text-[var(--color-text-disabled)]">
                <Clock size={13} aria-hidden="true" />
                <span>~{currentSubtask.durationMinutes} min</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Botones de acción principales — touch target 44px mínimo */}
      <div className="flex gap-3 mb-4">
        <Button
          id="done-btn"
          variant="primary"
          size="lg"
          onClick={onDone}
          disabled={!currentSubtask || isLoading}
          leftIcon={<CheckCircle size={18} aria-hidden="true" />}
          className="flex-1"
          aria-label="Marcar este paso como listo"
        >
          Listo
        </Button>

        <Button
          id="help-btn"
          variant="secondary"
          size="lg"
          onClick={onNeedHelp}
          leftIcon={<HelpCircle size={18} aria-hidden="true" />}
          className="flex-1"
          aria-label="Pedir ayuda con este paso"
        >
          Necesito ayuda
        </Button>
      </div>

      {/* Botón de modo TDAH */}
      <Button
        id="adhd-mode-btn"
        variant="ghost"
        size="md"
        onClick={onEnterAdhdMode}
        className="w-full text-[var(--color-text-secondary)]"
        aria-label="Activar modo de enfoque — muestra solo un paso a la vez"
      >
        ⚡ Modo enfoque
      </Button>

      {/* Información secundaria colapsable — no visible por defecto */}
      <div className="mt-4">
        <button
          id="toggle-details-btn"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
          aria-controls="details-section"
          className={clsx(
            'flex items-center gap-1.5 w-full',
            'text-[13px] text-[var(--color-text-disabled)]',
            'hover:text-[var(--color-text-secondary)]',
            'transition-colors duration-150',
            'py-2 rounded focus-visible:outline-none',
            'focus-visible:ring-[3px] focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2'
          )}
        >
          {showDetails ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
          {showDetails ? 'Ocultar detalles' : 'Ver plan completo'}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              id="details-section"
              initial={{ opacity: 0, scaleY: 0.95, transformOrigin: 'top' }}
              animate={animate || { opacity: 1, scaleY: 1 }}
              exit={animate || { opacity: 0, scaleY: 0.95 }}
              transition={transition || exitTransition}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-4">
                {goal.tasks.map((task, taskIdx) => (
                  <div key={task.id}>
                    <p className="text-[13px] font-semibold text-[var(--color-text-secondary)] mb-2">
                      {taskIdx + 1}. {task.title}
                    </p>
                    <ul className="space-y-1.5 ml-4" aria-label={`Pasos de ${task.title}`}>
                      {task.subtasks.map((subtask) => (
                        <li
                          key={subtask.id}
                          className={clsx(
                            'flex items-start gap-2 text-[14px]',
                            subtask.status === 'COMPLETED'
                              ? 'text-[var(--color-text-disabled)] line-through'
                              : 'text-[var(--color-text-primary)]'
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={clsx(
                              'w-4 h-4 rounded-full border shrink-0 mt-0.5',
                              subtask.status === 'COMPLETED'
                                ? 'bg-[var(--color-success)] border-[var(--color-success)]'
                                : 'border-[var(--color-border)]'
                            )}
                          />
                          {subtask.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default ActionCard
