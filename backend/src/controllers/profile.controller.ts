// Controlador de perfil de usuario (Fase 3)
// Maneja datos del perfil, contadores y actualización de nombre/timezone
import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// -------------------------------------------------------
// GET /api/v1/profile
// Obtener perfil completo con contadores y logros
// -------------------------------------------------------
export async function getProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'No autorizado' })

    // Obtener el usuario con sus logros
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        level: true,
        xp: true,
        streakDays: true,
        graceDaysUsed: true,
        createdAt: true,
        // Logros desbloqueados
        achievements: {
          orderBy: { earnedAt: 'desc' },
        },
      },
    })

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    // Contar objetivos y subtareas completadas
    const goalsCompleted = await prisma.goal.count({
      where: { userId, status: 'COMPLETED' },
    })

    const totalGoals = await prisma.goal.count({
      where: { userId },
    })

    const subtasksCompleted = await prisma.subtask.count({
      where: {
        task: { goal: { userId } },
        status: 'COMPLETED',
      },
    })

    res.json({
      ...user,
      goalsCompleted,
      totalGoals,
      subtasksCompleted,
    })
  } catch (error) {
    console.error('[Profile] Error en getProfile:', error)
    res.status(500).json({ message: 'Error al obtener perfil' })
  }
}

// -------------------------------------------------------
// PATCH /api/v1/profile
// Actualizar nombre y/o zona horaria
// -------------------------------------------------------
export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'No autorizado' })

    const { name, timezone } = req.body

    // Construir solo los campos que se van a actualizar
    const data: Record<string, string> = {}
    if (name !== undefined) data.name = name
    if (timezone !== undefined) data.timezone = timezone

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, timezone: true },
    })

    res.json(updatedUser)
  } catch (error) {
    console.error('[Profile] Error en updateProfile:', error)
    res.status(500).json({ message: 'Error al actualizar perfil' })
  }
}
