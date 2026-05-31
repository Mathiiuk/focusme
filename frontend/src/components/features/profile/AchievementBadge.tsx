import React from 'react'
import { motion } from 'framer-motion'

interface AchievementBadgeProps {
  name: string
  emoji: string
  description: string
  unlocked: boolean
  earnedAt: string | null
  index?: number
}

// -------------------------------------------------------
// AchievementBadge: badge visual de un logro
// Si está desbloqueado muestra el ícono con color
// Si está bloqueado muestra gris y semi-transparente
// -------------------------------------------------------
export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  name,
  emoji,
  description,
  unlocked,
  earnedAt,
  index = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`flex flex-col items-center justify-center text-center p-3 rounded-xl border transition-all ${
        unlocked
          ? 'bg-[var(--color-bg-surface)] border-[var(--color-accent)] shadow-sm'
          : 'bg-[var(--color-bg-muted)] border-[var(--color-border)] opacity-40 grayscale'
      }`}
      title={unlocked ? `${name}: ${description}` : `${name} — Aún no desbloqueado`}
      aria-label={unlocked
        ? `Logro desbloqueado: ${name}. ${description}`
        : `Logro bloqueado: ${name}`
      }
    >
      {/* Emoji del logro */}
      <span className="text-2xl mb-1" aria-hidden="true">{emoji}</span>

      {/* Nombre del logro */}
      <span className={`text-[11px] font-semibold leading-tight ${
        unlocked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-disabled)]'
      }`}>
        {name}
      </span>

      {/* Fecha si está desbloqueado */}
      {unlocked && earnedAt && (
        <span className="text-[9px] text-[var(--color-text-disabled)] mt-0.5">
          {new Date(earnedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
        </span>
      )}
    </motion.div>
  )
}

export default AchievementBadge
