import React, { useState, useCallback } from 'react'
import { Trophy, Award } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { GoalInput } from '@/components/features/dashboard/GoalInput'
import { ActionCard } from '@/components/features/dashboard/ActionCard'
import { BlockDialog } from '@/components/features/dashboard/BlockDialog'
import { useBlockDetection } from '@/hooks/useBlockDetection'
import { useDashboardStore, useAdhdStore } from '@/stores'
import { goalService, userService } from '@/services/api'
import type { UserProfile } from '@/services/api'
import type { Goal, BlockReason } from '@/types'
import { useNavigate } from 'react-router-dom'
import { EnergyCheckIn } from '@/components/features/dashboard/EnergyCheckIn'
import { LevelUpToast } from '@/components/features/dashboard/LevelUpToast'
import { AchievementToast } from '@/components/features/dashboard/AchievementToast'
import { CognitiveCoach } from '@/components/features/dashboard/CognitiveCoach'
import { TaskSkeleton } from '@/components/ui/Skeleton'
import { getDisplayError } from '@/lib/errorMessages'

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

  // Estado local: perfil de usuario y check-in de energía (Fase 2)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [energyCheckInOpen, setEnergyCheckInOpen] = useState(false)
  const [isLoggingEnergy, setIsLoggingEnergy] = useState(false)
  
  // Estado para la notificación de subida de nivel
  const [levelUpData, setLevelUpData] = useState<{ isVisible: boolean; level: number }>({ isVisible: false, level: 1 })
  
  // Estado para notificaciones de logros (Fase 3)
  const [achievementToastData, setAchievementToastData] = useState<{ isVisible: boolean; name: string; emoji: string; description: string }>({ isVisible: false, name: '', emoji: '', description: '' })

  // Cargar perfil de usuario al montar
  React.useEffect(() => {
    userService.getMe().then(user => {
      setUserProfile(user)
      // Comprobar si ya registró energía hoy
      const today = new Date().toDateString()
      const hasLoggedToday = user.energyLogs?.[0] && 
        new Date(user.energyLogs[0].recordedAt).toDateString() === today
      
      if (!hasLoggedToday) {
        setEnergyCheckInOpen(true)
      }
    }).catch(err => console.error('Error al cargar perfil:', err))
  }, [])

  // Manejar el submit de energía
  const handleEnergySubmit = async (level: number) => {
    setIsLoggingEnergy(true)
    try {
      await userService.logEnergy(level)
      setEnergyCheckInOpen(false)
    } catch (err) {
      console.error('Error al registrar energía:', err)
    } finally {
      setIsLoggingEnergy(false)
    }
  }

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
      // Re-lanzar con mensaje humano para que GoalInput lo muestre
      throw new Error(getDisplayError(err))
    }
  }, [setState, setCurrentGoal])

  // -------------------------------------------------------
  // Manejar "Listo" — marcar subtarea actual como completada
  // -------------------------------------------------------
  const handleDone = useCallback(async () => {
    // Si no hay un objetivo activo en el store, no hacemos nada
    if (!currentGoal) return

    // Encontrar la primera subtarea que aún está pendiente de realizar
    const currentSubtask = currentGoal.tasks
      .flatMap((t) => t.subtasks)
      .find((s) => s.status === 'PENDING')

    // Si no quedan subtareas pendientes, salimos del flujo
    if (!currentSubtask) return

    // --- ACTUALIZACIÓN OPTIMISTA (OPTIMISTIC UPDATE) ---
    // Guardamos el estado anterior del objetivo para poder revertirlo en caso de que la petición al servidor falle
    const previousGoal = currentGoal 

    // Obtener todas las subtareas para verificar si este es el paso final del objetivo completo
    const allSubtasks = currentGoal.tasks.flatMap((t) => t.subtasks)
    // Filtramos las subtareas que siguen pendientes
    const pendingSubtasks = allSubtasks.filter((s) => s.status === 'PENDING')
    // Comprobamos si es la última subtarea pendiente del objetivo (conteo igual a 1 y es la actual)
    const isLastSubtask = pendingSubtasks.length === 1 && pendingSubtasks[0].id === currentSubtask.id

    // Crear el nuevo objeto de objetivo con el estado actualizado de forma optimista
    const updatedGoal: Goal = {
      ...currentGoal,
      // Si es el último paso, marcamos de inmediato el objetivo como COMPLETADO en el frontend
      status: isLastSubtask ? ('COMPLETED' as const) : currentGoal.status,
      completedAt: isLastSubtask ? new Date().toISOString() : currentGoal.completedAt,
      tasks: currentGoal.tasks.map((task) => ({
        ...task,
        subtasks: task.subtasks.map((sub) =>
          sub.id === currentSubtask.id
            ? { ...sub, status: 'COMPLETED' as const, completedAt: new Date().toISOString() }
            : sub
        ),
      })),
    }
    // Seteamos el estado local del objetivo de inmediato para que la interfaz responda al instante
    setCurrentGoal(updatedGoal)

    try {
      // Realizar la llamada de red en segundo plano para persistir los cambios en la base de datos
      const response = await goalService.completeSubtask(currentSubtask.id)

      // Si el backend responde indicando cambios en XP y nivel, actualizamos el perfil local del usuario
      if (userProfile && response.xp !== undefined && response.level !== undefined) {
        setUserProfile(prev => prev ? { ...prev, xp: response.xp!, level: response.level! } : null)
        
        // Si el usuario subió de nivel, mostramos la felicitación correspondiente
        if (response.leveledUp) {
          setLevelUpData({ isVisible: true, level: response.level })
        }

        // Si se desbloquearon nuevos logros, los mostramos mediante la notificación emergente
        if (response.newAchievements && response.newAchievements.length > 0) {
          const first = response.newAchievements[0]
          setAchievementToastData({
            isVisible: true,
            name: first.name,
            emoji: first.emoji,
            description: first.description
          })
        }
      }

    } catch (err) {
      // Si la petición al servidor falla, revertimos el estado local silenciosamente sin frustrar al usuario
      console.error('Error al completar subtarea:', err)
      setCurrentGoal(previousGoal)
    }
  }, [currentGoal, setCurrentGoal, userProfile])

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
    <div className="w-full h-full p-4 md:p-8 flex flex-col items-center justify-center relative overflow-x-hidden">
      {/* Contenedor centralizado para la animación fluida */}
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {/* Estado vacío: mostrar el campo de entrada */}
          {/* Estado vacío: mostrar el campo de entrada */}
          {state === 'empty' && (
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

          {/* Estado de carga: skeleton en vez de spinner (reduce ansiedad) */}
          {state === 'loading' && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <TaskSkeleton />
            </motion.div>
          )}

          {/* Estado activo y objetivo completado: renderizar hermosa vista de celebración premium */}
          {state === 'active' && currentGoal && currentGoal.status === 'COMPLETED' && (
            <motion.div
              key="celebration"
              // Usar animaciones fluidas con Framer Motion si no se prefiere reducción de movimiento
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="surface p-8 text-center flex flex-col items-center justify-center border border-[var(--color-success)] shadow-[0_0_20px_rgba(34,197,94,0.15)] rounded-2xl relative overflow-hidden"
            >
              {/* Gradiente sutil decorativo de fondo */}
              <div className="absolute inset-0 bg-gradient-to-b from-[rgba(34,197,94,0.05)] to-transparent pointer-events-none" />

              {/* Contenedor del ícono de trofeo con animación divertida */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-[rgba(34,197,94,0.1)] flex items-center justify-center mb-6 border border-[rgba(34,197,94,0.2)] text-[var(--color-success)]"
              >
                <Trophy size={32} className="animate-bounce" />
              </motion.div>

              {/* Título de éxito principal */}
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                ¡Objetivo Completado!
              </h2>

              {/* Título descriptivo del objetivo completado */}
              <p className="text-base font-semibold text-[var(--color-text-secondary)] mb-6 max-w-sm">
                "{currentGoal.title}"
              </p>

              {/* Detalle visual de la recompensa de XP obtenida */}
              <div className="bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-xl py-3 px-6 mb-8 flex items-center gap-3">
                <Award className="text-[var(--color-success)]" size={20} />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  Recompensa obtenida: <strong className="text-[var(--color-success)]">+100 XP</strong>
                </span>
              </div>

              {/* Mensaje de motivación e incentivo para mantener la racha */}
              <p className="text-sm text-[var(--color-text-disabled)] mb-8 max-w-xs">
                ¡Excelente trabajo! Has completado todas las micro-acciones propuestas. Mantén este ritmo para seguir progresando.
              </p>

              {/* Botón principal para volver al estado inicial y establecer otro objetivo */}
              <button
                id="celebration-reset-btn"
                onClick={reset}
                className="w-full py-3.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-medium rounded-xl transition-colors shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-focus-ring)]"
              >
                Establecer nuevo objetivo
              </button>
            </motion.div>
          )}

          {/* Estado activo y objetivo en progreso: mostrar la tarjeta de acción estándar con la subtarea actual */}
          {state === 'active' && currentGoal && currentGoal.status !== 'COMPLETED' && (
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

              {/* Botón secundario para empezar con un objetivo completamente diferente */}
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

      <EnergyCheckIn
        isOpen={energyCheckInOpen}
        onClose={() => setEnergyCheckInOpen(false)}
        onSubmit={handleEnergySubmit}
        isLoading={isLoggingEnergy}
      />

      <LevelUpToast 
        isVisible={levelUpData.isVisible} 
        level={levelUpData.level} 
        onClose={() => setLevelUpData(prev => ({ ...prev, isVisible: false }))} 
      />

      <AchievementToast 
        isVisible={achievementToastData.isVisible}
        name={achievementToastData.name}
        emoji={achievementToastData.emoji}
        description={achievementToastData.description}
        onClose={() => setAchievementToastData(prev => ({ ...prev, isVisible: false }))}
      />

      {/* Coach Cognitivo Flotante */}
      <CognitiveCoach />
    </div>
  )
}

export default DashboardPage
