import React, { useState, useCallback } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { GoalInput } from '@/components/features/dashboard/GoalInput'
import { ActionCard } from '@/components/features/dashboard/ActionCard'
import { BlockDialog } from '@/components/features/dashboard/BlockDialog'
import { useBlockDetection } from '@/hooks/useBlockDetection'
import { useDashboardStore, useAdhdStore } from '@/stores'
import { goalService } from '@/services/api'
import type { Goal, BlockReason } from '@/types'
import { useNavigate } from 'react-router-dom'

// -------------------------------------------------------
// Página principal del Dashboard
// Estado vacío → campo de texto
// Estado activo → objetivo + acción actual
// -------------------------------------------------------
const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()

  // Estado del store del dashboard
  const { state, currentGoal, setState, setCurrentGoal, reset } = useDashboardStore()
  // Store del modo TDAH para activarlo desde aquí
  const { activate: activateAdhd } = useAdhdStore()

  // Estado local: diálogo de bloqueo
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)

  // Detectar inactividad — activo solo cuando hay un objetivo en curso
  useBlockDetection({
    enabled: state === 'active' && !blockDialogOpen,
    onBlock: () => setBlockDialogOpen(true),
  })

  // -------------------------------------------------------
  // Manejar el envío del objetivo
  // -------------------------------------------------------
  const handleGoalSubmit = useCallback(async (input: string) => {
    setState('loading')
    try {
      // Llamar al backend: crea el objetivo y la IA lo descompone
      const goal = await goalService.create({ input })
      setCurrentGoal(goal)
      setState('active')
    } catch (err) {
      setState('empty')
      throw err // re-lanzar para que GoalInput muestre el error
    }
  }, [setState, setCurrentGoal])

  // -------------------------------------------------------
  // Manejar "Listo" — marcar subtarea actual como completada
  // -------------------------------------------------------
  const handleDone = useCallback(async () => {
    if (!currentGoal) return

    // Encontrar la primera subtarea pendiente
    const currentSubtask = currentGoal.tasks
      .flatMap((t) => t.subtasks)
      .find((s) => s.status === 'PENDING')

    if (!currentSubtask) return

    try {
      // Actualizar en el servidor
      await goalService.completeSubtask(currentSubtask.id)

      // Actualizar estado local optimistamente
      const updatedGoal: Goal = {
        ...currentGoal,
        tasks: currentGoal.tasks.map((task) => ({
          ...task,
          subtasks: task.subtasks.map((sub) =>
            sub.id === currentSubtask.id
              ? { ...sub, status: 'COMPLETED' as const, completedAt: new Date().toISOString() }
              : sub
          ),
        })),
      }
      setCurrentGoal(updatedGoal)
    } catch (err) {
      console.error('Error al completar subtarea:', err)
    }
  }, [currentGoal, setCurrentGoal])

  // -------------------------------------------------------
  // Activar modo TDAH con las subtareas actuales
  // -------------------------------------------------------
  const handleEnterAdhdMode = useCallback(() => {
    if (!currentGoal) return
    const allSubtasks = currentGoal.tasks
      .flatMap((t) => t.subtasks)
      .filter((s) => s.status === 'PENDING')

    if (allSubtasks.length === 0) return
    activateAdhd(currentGoal.id, allSubtasks)
    navigate('/focus')
  }, [currentGoal, activateAdhd, navigate])

  // -------------------------------------------------------
  // Manejar selección de razón de bloqueo
  // -------------------------------------------------------
  const handleBlockReason = useCallback(
    async (reason: BlockReason, _aiResponse: string) => {
      if (!currentGoal) return
      try {
        // En producción: llamar a blockService.logBlock()
        console.log('Bloqueo registrado:', reason)
      } catch (err) {
        console.error('Error al registrar bloqueo:', err)
      }
    },
    [currentGoal]
  )

  // -------------------------------------------------------
  // Obtener la subtarea actual (primera pendiente)
  // -------------------------------------------------------
  const currentSubtask = currentGoal
    ? currentGoal.tasks.flatMap((t) => t.subtasks).find((s) => s.status === 'PENDING') ?? null
    : null

  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      {/* Contenedor centrado con ancho máximo para legibilidad */}
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {/* Estado vacío: mostrar el campo de entrada */}
          {(state === 'empty' || state === 'loading') && (
            <motion.div
              key="input"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <GoalInput onSubmit={handleGoalSubmit} />
            </motion.div>
          )}

          {/* Estado activo: mostrar la tarjeta de acción */}
          {state === 'active' && currentGoal && (
            <motion.div
              key="action"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ActionCard
                goal={currentGoal}
                currentSubtask={currentSubtask}
                onDone={handleDone}
                onNeedHelp={() => setBlockDialogOpen(true)}
                onEnterAdhdMode={handleEnterAdhdMode}
              />

              {/* Botón para empezar de nuevo */}
              <button
                id="start-over-btn"
                onClick={reset}
                className={[
                  'w-full mt-4 py-3 text-[14px]',
                  'text-[var(--color-text-disabled)]',
                  'hover:text-[var(--color-text-secondary)]',
                  'transition-colors duration-150 rounded',
                  'focus-visible:outline-none focus-visible:ring-[3px]',
                  'focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
                ].join(' ')}
              >
                Empezar con otro objetivo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Diálogo de bloqueo — fuera del contenedor para superposición correcta */}
      <BlockDialog
        isOpen={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        onSelectReason={handleBlockReason}
      />
    </main>
  )
}

export default DashboardPage
