import React, { useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAdhdStore, useAppConfigStore } from '@/stores'
import { Button } from '@/components/ui/Button'
import { Volume2, VolumeX, ArrowLeft } from 'lucide-react'
import { Icon } from '@/components/ui/Icon'

// -------------------------------------------------------
// Componente CelebrationToast
// Animación breve de 500ms al completar un paso
// -------------------------------------------------------
const CelebrationToast: React.FC = () => {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    // Si el usuario prefiere sin animación: solo un texto
    return (
      <div className="text-center py-4" aria-live="polite" role="status">
        <p className="text-[20px] font-semibold" style={{ color: 'var(--color-success)' }}>
          ¡Muy bien! ✓
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      // Duración exacta: 500ms según el spec
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="text-center py-4"
      aria-live="polite"
      role="status"
      aria-label="¡Paso completado!"
    >
      {/* Partículas de celebración con CSS */}
      <div className="relative inline-block">
        {/* Estrellas decorativas con posiciones absolutas */}
        {(['✦', '✧', '✦', '★'] as const).map((star, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute text-[var(--color-accent)] select-none pointer-events-none"
            style={{
              // Distribuir alrededor del texto central
              top: `${[-30, -20, -25, -35][i]}px`,
              left: `${[-20, 60, 30, 10][i]}px`,
              fontSize: `${[14, 10, 12, 8][i]}px`,
            }}
            initial={{ opacity: 0, y: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], y: -20, scale: [0, 1, 0] }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            {star}
          </motion.span>
        ))}
        <p
          className="text-[24px] font-bold"
          style={{ color: 'var(--color-success)' }}
        >
          ¡Listo! ✓
        </p>
      </div>
    </motion.div>
  )
}

// -------------------------------------------------------
// Página AdhdModePage
// Vista de foco total: solo el paso actual y el botón "Terminé"
// -------------------------------------------------------
const AdhdModePage: React.FC = () => {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const { speechEnabled, toggleSpeech } = useAppConfigStore()

  // Obtener estado del modo TDAH desde el store
  const {
    isActive,
    state: adhdState,
    completeCurrentSubtask,
    setShowCelebration,
    deactivate,
  } = useAdhdStore()

  // Si no está activo, redirigir al dashboard
  useEffect(() => {
    if (!isActive || !adhdState) {
      navigate('/', { replace: true })
    }
  }, [isActive, adhdState, navigate])

  // -------------------------------------------------------
  // Leer el paso en voz alta con Web Speech API
  // -------------------------------------------------------
  const speakCurrentStep = useCallback((text: string) => {
    if (!speechEnabled || !window.speechSynthesis) return

    // Cancelar cualquier lectura anterior
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    // Configurar el idioma: español de Argentina
    utterance.lang = 'es-AR'
    utterance.rate = 0.9   // un poco más lento para claridad
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }, [speechEnabled])

  // Leer automáticamente cuando cambia el paso actual
  useEffect(() => {
    if (!adhdState) return
    const currentSubtask = adhdState.subtasks[adhdState.currentSubtaskIndex]
    if (currentSubtask && speechEnabled) {
      speakCurrentStep(currentSubtask.title)
    }
    // Cancelar lectura al desmontar
    return () => { window.speechSynthesis?.cancel() }
  }, [adhdState?.currentSubtaskIndex, speechEnabled, speakCurrentStep])

  // -------------------------------------------------------
  // Manejar completar el paso actual
  // -------------------------------------------------------
  const handleComplete = useCallback(() => {
    if (!adhdState) return

    // Mostrar celebración brevemente
    completeCurrentSubtask()
    
    // Feedback táctil (Problema 3)
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10])
    }

    // Ocultar celebración después de 600ms exactos (según spec del prompt)
    setTimeout(() => {
      setShowCelebration(false)
      // Verificar si era el último paso
      const nextIndex = adhdState.currentSubtaskIndex + 1
      if (nextIndex >= adhdState.subtasks.length) {
        // Todos los pasos completados: volver al dashboard
        deactivate()
        navigate('/')
      }
    }, 500)
  }, [adhdState, completeCurrentSubtask, setShowCelebration, deactivate, navigate])

  // Navegar con teclado: Enter y Espacio completan el paso
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        // Solo si el foco no está en otro elemento interactivo
        if (document.activeElement === document.body) {
          e.preventDefault()
          handleComplete()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleComplete])

  if (!adhdState) return null

  // Obtener el paso actual
  const currentSubtask = adhdState.subtasks[adhdState.currentSubtaskIndex]
  const isLastStep = adhdState.currentSubtaskIndex >= adhdState.subtasks.length - 1
  const stepNumber = adhdState.currentSubtaskIndex + 1
  const totalSteps = adhdState.subtasks.length

  return (
    <main
      id="adhd-mode-main"
      // Fondo sólido sin textura para eliminar distracción visual
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--color-bg-primary)' }}
      role="main"
      aria-label="Modo de enfoque"
    >
      {/* Barra superior mínima: solo navegación y controles de accesibilidad */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
        {/* Botón para salir del modo TDAH */}
        <button
          id="adhd-exit-btn"
          onClick={() => { deactivate(); navigate('/') }}
          aria-label="Salir del modo de enfoque"
          className={[
            'flex items-center gap-2 py-2 px-3 rounded-lg',
            'text-[var(--color-text-disabled)] text-[14px]',
            'hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-[3px]',
            'focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
          ].join(' ')}
        >
          <Icon icon={ArrowLeft} size="md" />
          Salir
        </button>

        {/* Indicador de progreso: "Paso 2 de 7" */}
        <div
          className="text-[14px] font-medium text-[var(--color-text-secondary)]"
          aria-live="polite"
          aria-label={`Paso ${stepNumber} de ${totalSteps}`}
        >
          {stepNumber} / {totalSteps}
        </div>

        {/* Toggle de voz */}
        <button
          id="adhd-voice-btn"
          onClick={toggleSpeech}
          aria-pressed={speechEnabled}
          aria-label={speechEnabled ? 'Desactivar voz en off' : 'Activar voz en off'}
          className={[
            'flex items-center justify-center w-[44px] h-[44px] rounded-lg',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-[3px]',
            'focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
            speechEnabled
              ? 'text-[var(--color-accent)] bg-[var(--color-accent-light)]'
              : 'text-[var(--color-text-disabled)] hover:bg-[var(--color-bg-muted)]',
          ].join(' ')}
        >
          {speechEnabled
            ? <Icon icon={Volume2} size="lg" />
            : <Icon icon={VolumeX} size="lg" />
          }
        </button>
      </div>

      {/* Contenido central — lo único que importa en esta pantalla */}
      <div className="w-full max-w-md text-center">
        <AnimatePresence mode="wait">
          {/* Celebración breve */}
          {adhdState.showCelebration && (
            <motion.div
              key="celebration"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <CelebrationToast />
            </motion.div>
          )}

          {/* Paso actual */}
          {!adhdState.showCelebration && currentSubtask && (
            <motion.div
              key={`step-${adhdState.currentSubtaskIndex}`}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* Texto del paso — tipografía grande, sin decoración */}
              <p
                id="current-step-text"
                className="font-semibold leading-relaxed mb-10"
                style={{
                  // 24px mínimo según spec del modo TDAH
                  fontSize: 'clamp(22px, 4vw, 32px)',
                  color: 'var(--color-text-primary)',
                  lineHeight: '1.4',
                }}
                aria-live="polite"
              >
                {currentSubtask.title}
              </p>

              {/* Botón enorme "Terminé" — el elemento más importante de la pantalla */}
              <Button
                id="adhd-done-btn"
                variant="primary"
                size="adhd"
                onClick={handleComplete}
                aria-label={`Marcar como terminado: ${currentSubtask.title}`}
              >
                {isLastStep ? '¡Terminé todo!' : 'Terminé ✓'}
              </Button>

              {/* Instrucción de teclado para usuarios avanzados */}
              <p
                className="mt-6 text-[13px]"
                style={{ color: 'var(--color-text-disabled)' }}
              >
                También podés presionar{' '}
                <kbd
                  className="px-2 py-0.5 text-[11px] rounded border"
                  style={{
                    background: 'var(--color-bg-muted)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  Enter
                </kbd>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Barra de progreso en la parte inferior — discreta */}
      <div
        className="fixed bottom-0 left-0 right-0 h-1"
        style={{ background: 'var(--color-bg-muted)' }}
        role="progressbar"
        aria-valuenow={stepNumber}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Progreso: ${stepNumber} de ${totalSteps} pasos`}
      >
        <motion.div
          className="h-full"
          style={{ background: 'var(--color-accent)' }}
          initial={{ width: `${((stepNumber - 1) / totalSteps) * 100}%` }}
          animate={{ width: `${(stepNumber / totalSteps) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </main>
  )
}

export default AdhdModePage
