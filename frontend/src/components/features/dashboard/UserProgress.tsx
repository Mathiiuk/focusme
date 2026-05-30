import React from 'react'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

interface UserProgressProps {
  level: number
  xp: number
  streakDays: number
}

export const UserProgress: React.FC<UserProgressProps> = ({ level, xp, streakDays }) => {
  // Formula: L = floor(sqrt(XP / 50)) + 1
  // Por lo tanto, el XP para alcanzar un nivel L es: XP = 50 * (L - 1)^2
  const currentLevelXp = 50 * Math.pow(level - 1, 2)
  const nextLevelXp = 50 * Math.pow(level, 2)
  
  // Calcular el progreso dentro del nivel actual (de 0 a 100%)
  const xpInCurrentLevel = xp - currentLevelXp
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp
  const progressPercent = Math.max(0, Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100))

  return (
    <div className="flex items-center justify-between w-full p-4 bg-[var(--color-bg-muted)] rounded-xl border border-[var(--color-border)] mb-6">
      <div className="flex flex-col min-w-[70px]">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Nivel {level}</span>
        <span className="text-xs text-[var(--color-text-secondary)]">{xp} / {nextLevelXp} XP</span>
      </div>
      
      <div className="flex-1 mx-4 lg:mx-6">
        <div className="h-2.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <motion.div 
            className="h-full bg-[var(--color-accent)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-w-[50px]">
        <div className="flex items-center gap-1 text-orange-500">
          <Flame size={18} aria-hidden="true" />
          <span className="text-sm font-bold" aria-label={`Racha de ${streakDays} días`}>{streakDays}</span>
        </div>
        <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">Racha</span>
      </div>
    </div>
  )
}
