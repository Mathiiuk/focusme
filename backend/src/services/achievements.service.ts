// Servicio de Logros (Fase 3)
// Evalúa y otorga logros automáticamente basándose en las acciones del usuario
// Los logros son no competitivos: celebran hitos personales sin presionar

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// -------------------------------------------------------
// Definición de todos los logros posibles
// Cada logro tiene un tipo único, nombre amigable, descripción
// y una función que evalúa si se debe otorgar
// -------------------------------------------------------
interface AchievementDef {
  type: string
  name: string
  description: string
  emoji: string
  check: (userId: string) => Promise<boolean>
}

const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  {
    type: 'primer_paso',
    name: 'Primer Paso',
    description: 'Completaste tu primera micro-acción. ¡El inicio más difícil ya pasó!',
    emoji: '🌟',
    check: async (userId) => {
      const count = await prisma.subtask.count({
        where: { task: { goal: { userId } }, status: 'COMPLETED' },
      })
      return count >= 1
    },
  },
  {
    type: 'objetivo_completo',
    name: 'Misión Cumplida',
    description: 'Completaste tu primer objetivo completo. ¡Increíble!',
    emoji: '🏆',
    check: async (userId) => {
      const count = await prisma.goal.count({
        where: { userId, status: 'COMPLETED' },
      })
      return count >= 1
    },
  },
  {
    type: 'racha_3',
    name: 'Tres Seguidos',
    description: '3 días consecutivos usando FocusFlow. La constancia es tu superpoder.',
    emoji: '🔥',
    check: async (userId) => {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { streakDays: true } })
      return (user?.streakDays ?? 0) >= 3
    },
  },
  {
    type: 'racha_7',
    name: 'Semana Invicta',
    description: '¡Una semana completa! Tu cerebro te lo agradece.',
    emoji: '⚡',
    check: async (userId) => {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { streakDays: true } })
      return (user?.streakDays ?? 0) >= 7
    },
  },
  {
    type: 'racha_30',
    name: 'Mes de Constancia',
    description: '30 días seguidos. Sos una máquina de hábitos.',
    emoji: '💎',
    check: async (userId) => {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { streakDays: true } })
      return (user?.streakDays ?? 0) >= 30
    },
  },
  {
    type: 'energia_constante',
    name: 'Autoconciencia',
    description: 'Registraste tu energía 7 días seguidos. Conocerte es el primer paso.',
    emoji: '🧠',
    check: async (userId) => {
      // Verificar si tiene al menos 7 registros de energía en los últimos 7 días
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const count = await prisma.energyLog.count({
        where: { userId, recordedAt: { gte: sevenDaysAgo } },
      })
      return count >= 7
    },
  },
  {
    type: 'diez_subtareas',
    name: 'Diez Pequeños Pasos',
    description: '10 micro-acciones completadas. ¡Cada paso suma!',
    emoji: '👣',
    check: async (userId) => {
      const count = await prisma.subtask.count({
        where: { task: { goal: { userId } }, status: 'COMPLETED' },
      })
      return count >= 10
    },
  },
  {
    type: 'cincuenta_subtareas',
    name: 'Medio Centenar',
    description: '50 micro-acciones. ¡Eso es constancia de verdad!',
    emoji: '🎯',
    check: async (userId) => {
      const count = await prisma.subtask.count({
        where: { task: { goal: { userId } }, status: 'COMPLETED' },
      })
      return count >= 50
    },
  },
  {
    type: 'usa_coach',
    name: 'Pidió Refuerzos',
    description: 'Usaste el coach cognitivo. Pedir ayuda es de valientes.',
    emoji: '🤝',
    check: async (userId) => {
      const count = await prisma.aiConversation.count({ where: { userId } })
      return count >= 1
    },
  },
  {
    type: 'supero_bloqueo',
    name: 'Desbloqueado',
    description: 'Resolviste un bloqueo sin abandonar la tarea. ¡Resiliencia pura!',
    emoji: '🔓',
    check: async (userId) => {
      const count = await prisma.blockEvent.count({
        where: { userId, resolvedAt: { not: null } },
      })
      return count >= 1
    },
  },
]

// -------------------------------------------------------
// Verificar y otorgar logros pendientes para un usuario
// Devuelve los logros recién desbloqueados
// -------------------------------------------------------
export async function checkAndGrantAchievements(userId: string) {
  // Obtener los logros que ya tiene el usuario
  const existingAchievements = await prisma.achievement.findMany({
    where: { userId },
    select: { type: true },
  })
  const existingTypes = new Set(existingAchievements.map(a => a.type))

  // Evaluar cada logro que aún no tiene
  const newAchievements: { type: string; name: string; emoji: string; description: string }[] = []

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    // Si ya lo tiene, saltar
    if (existingTypes.has(def.type)) continue

    // Evaluar si cumple la condición
    const earned = await def.check(userId)
    if (earned) {
      // Otorgar el logro en la base de datos
      await prisma.achievement.create({
        data: { userId, type: def.type },
      })
      newAchievements.push({
        type: def.type,
        name: def.name,
        emoji: def.emoji,
        description: def.description,
      })
    }
  }

  return newAchievements
}

// -------------------------------------------------------
// Obtener la lista completa de logros con estado locked/unlocked
// Para mostrar en el perfil del usuario
// -------------------------------------------------------
export async function getAllAchievementsForUser(userId: string) {
  const earned = await prisma.achievement.findMany({
    where: { userId },
    select: { type: true, earnedAt: true },
  })
  const earnedMap = new Map(earned.map(a => [a.type, a.earnedAt]))

  return ACHIEVEMENT_DEFINITIONS.map(def => ({
    type: def.type,
    name: def.name,
    description: def.description,
    emoji: def.emoji,
    unlocked: earnedMap.has(def.type),
    earnedAt: earnedMap.get(def.type) ?? null,
  }))
}
