import React, { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Dialog } from '@/components/ui/Dialog'
import type { BlockReason } from '@/types'

// -------------------------------------------------------
// Opciones de bloqueo — cuatro razones predefinidas
// Cada una genera una respuesta distinta de la IA
// -------------------------------------------------------
interface BlockOption {
  id: BlockReason
  label: string
  emoji: string
  description: string
}

const BLOCK_OPTIONS: BlockOption[] = [
  {
    id: 'DONT_KNOW_HOW_TO_START',
    label: 'No sé cómo empezar',
    emoji: '🧭', // Cambiado de 🌫️ (niebla) a 🧭 (brújula) para compatibilidad total de emojis en Windows y mejor significado visual
    description: 'La tarea existe pero no encuentro el punto de entrada.',
  },
  {
    id: 'DONT_UNDERSTAND',
    label: 'No entiendo la tarea',
    emoji: '❓',
    description: 'Me resulta confusa o ambigua.',
  },
  {
    id: 'TOO_BIG',
    label: 'Me parece muy grande',
    emoji: '🏔️',
    description: 'Se siente abrumador aunque sepa qué hay que hacer.',
  },
  {
    id: 'DISTRACTED',
    label: 'Me distraje con otra cosa',
    emoji: '🌀',
    description: 'Mi mente se fue a otro lado.',
  },
]

// -------------------------------------------------------
// Respuestas de la IA (mock local mientras no hay backend)
// En producción, estas vienen del endpoint /blocks
// -------------------------------------------------------
const AI_RESPONSES: Record<BlockReason, string> = {
  DONT_KNOW_HOW_TO_START:
    'No hay problema — empezar siempre es lo más difícil. Probá hacer esto primero: abrí el documento (o lo que sea el "lugar") donde va a ocurrir la tarea. Solo abrirlo ya es empezar.',
  DONT_UNDERSTAND:
    'Perfectamente válido. ¿Qué parte te genera más confusión? Podemos reformular la tarea para que tenga más sentido para vos, con tus propias palabras.',
  TOO_BIG:
    'Tiene sentido que se sienta grande. Propongo partir de aquí: olvidáte del proyecto completo por ahora. ¿Cuál sería la versión más pequeña posible de este paso?',
  DISTRACTED:
    'Pasa seguido y está bien. Cuando estés listo, volvemos. Tu lugar está aquí.',
}

// -------------------------------------------------------
// Props del componente
// -------------------------------------------------------
interface BlockDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectReason: (reason: BlockReason, aiResponse: string) => void
}

// -------------------------------------------------------
// Componente BlockDialog
// Diálogo suave que aparece después de 10 minutos de inactividad
// -------------------------------------------------------
export const BlockDialog: React.FC<BlockDialogProps> = ({
  isOpen,
  onClose,
  onSelectReason,
}) => {
  // Estado: qué opción seleccionó el usuario
  const [selectedReason, setSelectedReason] = useState<BlockReason | null>(null)
  // Estado: mostrar la respuesta de la IA
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const shouldReduceMotion = useReducedMotion()

  // Manejar selección de razón de bloqueo
  const handleSelectReason = (reason: BlockReason) => {
    setSelectedReason(reason)
    const response = AI_RESPONSES[reason]
    setAiResponse(response)
    // Notificar al padre para guardar en base de datos
    onSelectReason(reason, response)
  }

  // Resetear estado al cerrar
  const handleClose = () => {
    setSelectedReason(null)
    setAiResponse(null)
    onClose()
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="¿Estás bien?"
      description="Sin apuro. Estamos acá para ayudarte."
    >
      <AnimatePresence mode="wait">
        {/* Vista inicial: las 4 opciones */}
        {!aiResponse && (
          <motion.div
            key="options"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-[15px] text-[var(--color-text-secondary)] mb-4 leading-relaxed">
              ¿Qué está pasando?
            </p>

            {/* Lista de opciones — cada una es un botón accesible */}
            <ul className="space-y-2" role="list" aria-label="Razones de bloqueo">
              {BLOCK_OPTIONS.map((option) => (
                <li key={option.id}>
                  <button
                    id={`block-option-${option.id}`}
                    onClick={() => handleSelectReason(option.id)}
                    className={[
                      // Touch target mínimo 44px de altura
                      'w-full min-h-[56px] px-4 py-3 rounded-lg text-left',
                      'flex items-center gap-3',
                      'border-2 border-[var(--color-border)]',
                      'hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)]',
                      'transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-[3px]',
                      'focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
                      selectedReason === option.id
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                        : '',
                    ].join(' ')}
                    aria-pressed={selectedReason === option.id}
                  >
                    {/* Emoji representativo — aria-hidden porque el texto ya describe */}
                    <span className="text-xl w-8 text-center" aria-hidden="true">
                      {option.emoji}
                    </span>
                    <div>
                      <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                        {option.label}
                      </p>
                      <p className="text-[13px] text-[var(--color-text-secondary)]">
                        {option.description}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {/* Opción de simplemente cerrar */}
            <button
              id="block-close-btn"
              onClick={handleClose}
              className={[
                'w-full mt-3 py-3 text-[14px]',
                'text-[var(--color-text-disabled)]',
                'hover:text-[var(--color-text-secondary)]',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-[3px]',
                'focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 rounded',
              ].join(' ')}
            >
              Estoy bien, gracias
            </button>
          </motion.div>
        )}

        {/* Vista de respuesta de la IA */}
        {aiResponse && (
          <motion.div
            key="response"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Indicador de qué eligió el usuario */}
            {selectedReason && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-[var(--color-bg-muted)]">
                <span className="text-xl" aria-hidden="true">
                  {BLOCK_OPTIONS.find((o) => o.id === selectedReason)?.emoji}
                </span>
                <span className="text-[14px] font-medium text-[var(--color-text-secondary)]">
                  {BLOCK_OPTIONS.find((o) => o.id === selectedReason)?.label}
                </span>
              </div>
            )}

            {/* Respuesta de la IA — lenguaje empático, sin juicio */}
            <div
              className="p-4 rounded-lg bg-[var(--color-accent-light)] border border-[var(--color-border)]"
              role="status"
              aria-live="polite"
              aria-label="Respuesta de FocusFlow"
            >
              <p className="text-[13px] font-medium text-[var(--color-accent)] mb-2 uppercase tracking-wider">
                FocusFlow dice:
              </p>
              <p className="text-[16px] text-[var(--color-text-primary)] leading-relaxed">
                {aiResponse}
              </p>
            </div>

            {/* Botones de acción post-respuesta */}
            <div className="flex gap-2 mt-4">
              <button
                id="block-try-again-btn"
                onClick={handleClose}
                className={[
                  'flex-1 py-3 px-4 rounded-lg text-[15px] font-medium',
                  'bg-[var(--color-accent)] text-white',
                  'hover:bg-[var(--color-accent-hover)]',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-[3px]',
                  'focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
                  'min-h-[44px]',
                ].join(' ')}
              >
                Lo intento
              </button>
              <button
                id="block-different-btn"
                onClick={() => { setAiResponse(null); setSelectedReason(null) }}
                className={[
                  'flex-1 py-3 px-4 rounded-lg text-[15px]',
                  'border-2 border-[var(--color-border)]',
                  'text-[var(--color-text-secondary)]',
                  'hover:border-[var(--color-accent)]',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-[3px]',
                  'focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
                  'min-h-[44px]',
                ].join(' ')}
              >
                Elegir otra
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}

export default BlockDialog
