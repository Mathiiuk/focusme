// Servicio de Gamificación (Fase 2)
// Maneja XP, niveles, rachas y "días de gracia" (TDAH-friendly)

import { PrismaClient, User } from '@prisma/client'
import { checkAndGrantAchievements } from './achievements.service'

const prisma = new PrismaClient()

// -------------------------------------------------------
// Calcular nivel basado en XP
// Usamos una curva de progresión suave
// -------------------------------------------------------
export function calculateLevel(xp: number): number {
  // Fórmula: Nivel = Math.floor(Math.sqrt(xp / 50)) + 1
  // 50 XP -> Nivel 2
  // 200 XP -> Nivel 3
  // 450 XP -> Nivel 4
  return Math.floor(Math.sqrt(xp / 50)) + 1
}

// -------------------------------------------------------
// Procesar recompensa por completar tarea u objetivo
// -------------------------------------------------------
export async function processGamification(userId: string, xpToAdd: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Usuario no encontrado')

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  let newStreak = user.streakDays
  let newGraceDays = user.graceDaysUsed

  // Cálculo de racha amigable con TDAH
  if (user.lastActiveAt) {
    const lastActive = new Date(user.lastActiveAt)
    const lastActiveDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate())
    
    // Diferencia en días
    const diffTime = today.getTime() - lastActiveDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      // Activo el día siguiente
      newStreak += 1
    } else if (diffDays > 1) {
      // Faltó 1 o más días
      const missedDays = diffDays - 1
      // El usuario tiene hasta 2 días de gracia
      if (missedDays <= (2 - newGraceDays)) {
        newGraceDays += missedDays
        newStreak += 1 // Mantiene la racha pero consume días de gracia
      } else {
        newStreak = 1 // Pierde la racha
        newGraceDays = 0 // Reinicia los días de gracia
      }
    }
    // Si diffDays === 0, ya interactuó hoy, no cambia la racha
  } else {
    // Primera interacción
    newStreak = 1
  }

  const newXp = user.xp + xpToAdd
  const newLevel = calculateLevel(newXp)
  const leveledUp = newLevel > user.level

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newXp,
      level: newLevel,
      streakDays: newStreak,
      graceDaysUsed: newGraceDays,
      lastActiveAt: now
    }
  })

  // Verificar y otorgar logros pendientes (Fase 3)
  const newAchievements = await checkAndGrantAchievements(userId)

  return { user: updatedUser, leveledUp, newAchievements }
}
