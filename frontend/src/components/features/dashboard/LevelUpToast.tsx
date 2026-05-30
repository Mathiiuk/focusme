import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'
import confetti from 'canvas-confetti' // Necesitamos instalar esto o simularlo

interface LevelUpToastProps {
  level: number
  isVisible: boolean
  onClose: () => void
}

export const LevelUpToast: React.FC<LevelUpToastProps> = ({ level, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      // Lanzar confeti sutil si está visible
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b']
        })
      } catch (e) {
        // Ignorar si no está instalado
      }
      
      const timer = setTimeout(() => {
        onClose()
      }, 4000)
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
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[var(--color-bg-primary)] border-2 border-yellow-400 p-4 rounded-2xl shadow-xl w-max max-w-[90vw]"
          role="alert"
        >
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
            <Trophy size={28} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[var(--color-text-primary)]">¡Subiste de Nivel!</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Alcanzaste el Nivel {level}. ¡Excelente progreso!</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
