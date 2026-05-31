import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AchievementToastProps {
  isVisible: boolean
  name: string
  emoji: string
  description: string
  onClose: () => void
}

// -------------------------------------------------------
// AchievementToast: celebración sutil al desbloquear un logro
// Se auto-oculta en 4 segundos sin ser agresivo
// -------------------------------------------------------
export const AchievementToast: React.FC<AchievementToastProps> = ({
  isVisible,
  name,
  emoji,
  description,
  onClose,
}) => {
  // Auto-ocultar después de 4 segundos
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[var(--color-bg-surface)] border-2 border-[var(--color-accent)] p-4 rounded-2xl shadow-xl w-max max-w-[90vw]"
          role="alert"
          aria-live="polite"
        >
          <span className="text-3xl" aria-hidden="true">{emoji}</span>
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
              ¡Logro desbloqueado!
            </h3>
            <p className="text-sm font-semibold text-[var(--color-accent)]">{name}</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AchievementToast
