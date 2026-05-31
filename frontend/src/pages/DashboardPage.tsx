import React, { useState, useCallback } from 'react'
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
    if (!currentGoal) return

    // Encontrar la primera subtarea pendiente
    const currentSubtask = currentGoal.tasks
      .flatMap((t) => t.subtasks)
      .find((s) => s.status === 'PENDING')

    if (!currentSubtask) return

    // --- OPTIMISTIC UPDATE ---
    // Actualizar UI inmediatamente para que el usuario sienta que la acción fue instantánea.
    // La llamada al servidor ocurre en background. Si falla, revertimos silenciosamente.
    const previousGoal = currentGoal // Guardar snapshot para poder revertir
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

    try {
      // Ahora sí confirmar con el servidor en background
      const response = await goalService.completeSubtask(currentSubtask.id)

      // Actualizar perfil de usuario si cambió el XP/Nivel
      if (userProfile && response.xp !== undefined && response.level !== undefined) {
        setUserProfile(prev => prev ? { ...prev, xp: response.xp!, level: response.level! } : null)
        
        // Mostrar notificación de nivel si corresponde
        if (response.leveledUp) {
          setLevelUpData({ isVisible: true, level: response.level })
        }

        // Mostrar notificación de logros
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
      // Si falla, revertir silenciosamente al estado anterior sin alarmar
      console.error('Error al completar subtarea:', err)
      setCurrentGoal(previousGoal)
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
