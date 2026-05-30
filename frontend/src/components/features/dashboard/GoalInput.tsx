import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GoalTextarea } from '@/components/ui/Input'
import { useDashboardStore } from '@/stores'

// -------------------------------------------------------
// Ejemplos de objetivos para inspirar al usuario
// Rotan aleatoriamente en el placeholder
// -------------------------------------------------------
const PLACEHOLDER_EXAMPLES = [
  '¿Qué querés lograr hoy?',
  'Ej: Quiero organizar mi escritorio...',
  'Ej: Necesito estudiar para el examen...',
  'Ej: Quiero preparar la presentación...',
  'Ej: Tengo que responder los emails...',
]

// -------------------------------------------------------
// Componente GoalInput
// Campo de entrada principal del dashboard
// -------------------------------------------------------
interface GoalInputProps {
  onSubmit: (input: string) => Promise<void>
}

export const GoalInput: React.FC<GoalInputProps> = ({ onSubmit }) => {
  const { inputValue, setInputValue } = useDashboardStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  // Índice del placeholder actual para rotación
  const [placeholderIdx] = useState(() => Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length))
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const shouldReduceMotion = useReducedMotion()

  // Manejar el envío del formulario
  const handleSubmit = useCallback(async () => {
    const trimmed = inputValue.trim()
    // Validación: el campo no puede estar vacío
    if (!trimmed) {
      setError('Escribí qué querés lograr para que pueda ayudarte.')
      textareaRef.current?.focus()
      return
    }
    // Validación: mínimo 5 caracteres para tener contexto
    if (trimmed.length < 5) {
      setError('Contame un poco más — cuántos más detalles, mejor te puedo ayudar.')
      return
    }

    setError(undefined)
    setIsLoading(true)
    try {
      await onSubmit(trimmed)
    } catch {
      setError('Algo salió mal. Intentá de nuevo en un momento.')
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, onSubmit])

  // Enviar con Ctrl+Enter o Cmd+Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <motion.div
      // Animación de entrada suave
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full"
    >
      {/* Encabezado empático */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          {/* Logo / ícono */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-accent)' }}
            aria-hidden="true"
          >
            <Sparkles size={20} color="white" />
          </div>
          <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">
            FocusFlow
          </h1>
        </div>
        <p className="text-[17px] text-[var(--color-text-secondary)] leading-relaxed max-w-sm mx-auto">
          Contame qué tenés en mente y lo convertimos juntos en pasos concretos.
        </p>
      </div>

      {/* Campo de texto principal */}
      <div className="surface p-5">
        <GoalTextarea
          ref={textareaRef}
          id="goal-input"
          // Label visualmente oculto pero presente para lectores de pantalla
          label="Tu objetivo de hoy"
          placeholder={PLACEHOLDER_EXAMPLES[placeholderIdx]}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            // Limpiar error al empezar a escribir
            if (error) setError(undefined)
          }}
          onKeyDown={handleKeyDown}
          isLarge
          error={error}
          disabled={isLoading}
          maxLength={500}
          aria-label="Describí tu objetivo o tarea"
        />

        {/* Contador de caracteres (visible cuando >200 chars) */}
        <AnimatePresence>
          {inputValue.length > 200 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[13px] text-[var(--color-text-disabled)] text-right mt-1"
              aria-live="polite"
            >
              {inputValue.length}/500
            </motion.p>
          )}
        </AnimatePresence>

        {/* Botón de envío */}
        <Button
          id="submit-goal-btn"
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={isLoading}
          rightIcon={!isLoading ? <ArrowRight size={18} aria-hidden="true" /> : undefined}
          className="w-full mt-4"
          aria-label={isLoading ? 'Analizando tu objetivo...' : 'Empezar a organizar mi objetivo'}
        >
          {isLoading ? 'Analizando...' : 'Empezar'}
        </Button>

        {/* Ayuda para teclado */}
        <p className="text-[12px] text-[var(--color-text-disabled)] text-center mt-3">
          También podés presionar{' '}
          <kbd className="px-1.5 py-0.5 text-[11px] bg-[var(--color-bg-muted)] rounded border border-[var(--color-border)]">
            Ctrl+Enter
          </kbd>{' '}
          para enviar
        </p>
      </div>

      {/* Texto de tranquilidad */}
      <p className="text-center text-[14px] text-[var(--color-text-disabled)] mt-5 leading-relaxed">
        Sin apuro. Podés escribir tanto o tan poco como quieras.
      </p>
    </motion.div>
  )
}

export default GoalInput
