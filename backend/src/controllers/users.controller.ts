// Controlador de usuarios, energía y gamificación
import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// -------------------------------------------------------
// Obtener perfil del usuario actual (Nivel, XP, Energía)
// -------------------------------------------------------
export async function getMe(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'No autorizado' })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        level: true,
        xp: true,
        streakDays: true,
        graceDaysUsed: true,
        // Traemos el último registro de energía para saber si ya llenó el check-in hoy
        energyLogs: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        }
      }
    })

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    res.json(user)
  } catch (error) {
    console.error('[Users] Error en getMe:', error)
    res.status(500).json({ message: 'Error al obtener perfil' })
  }
}

// -------------------------------------------------------
// Registrar nivel de energía diario (1-5)
// -------------------------------------------------------
export async function logEnergy(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'No autorizado' })

    const { level } = req.body
    if (typeof level !== 'number' || level < 1 || level > 5) {
      return res.status(400).json({ message: 'Nivel de energía inválido (1-5)' })
    }

    // Verificar si ya registró hoy (desde la medianoche local aprox, simplificado en UTC)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const existingLog = await prisma.energyLog.findFirst({
      where: {
        userId,
        recordedAt: { gte: today }
      }
    })

    let energyLog;
    if (existingLog) {
      // Actualizar el registro de hoy si el usuario cambió de opinión
      energyLog = await prisma.energyLog.update({
        where: { id: existingLog.id },
        data: { level }
      })
    } else {
      // Crear nuevo registro
      energyLog = await prisma.energyLog.create({
        data: { userId, level }
      })
    }

    res.json(energyLog)
  } catch (error) {
    console.error('[Users] Error en logEnergy:', error)
    res.status(500).json({ message: 'Error al registrar energía' })
  }
}

// -------------------------------------------------------
// Obtener estadísticas de los últimos 7 días
// -------------------------------------------------------
export async function getStats(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'No autorizado' })

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Obtener subtareas completadas
    const completedTasks = await prisma.subtask.findMany({
      where: {
        task: { goal: { userId } },
        status: 'COMPLETED',
        completedAt: { gte: sevenDaysAgo }
      },
      select: { completedAt: true }
    })

    // Obtener logs de energía
    const energyLogs = await prisma.energyLog.findMany({
      where: { userId, recordedAt: { gte: sevenDaysAgo } },
      select: { level: true, recordedAt: true }
    })

    // Agrupar por día (YYYY-MM-DD)
    const statsByDay: Record<string, { date: string, label: string, tasks: number, energy: number | null }> = {}
    
    // Inicializar los últimos 7 días
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      statsByDay[dateStr] = { 
        date: dateStr, 
        label: daysOfWeek[d.getDay()], 
        tasks: 0, 
        energy: null 
      }
    }

    // Contar tareas
    completedTasks.forEach(t => {
      if (t.completedAt) {
        const dateStr = t.completedAt.toISOString().split('T')[0]
        if (statsByDay[dateStr]) statsByDay[dateStr].tasks++
      }
    })

    // Asignar energía
    energyLogs.forEach(e => {
      const dateStr = e.recordedAt.toISOString().split('T')[0]
      if (statsByDay[dateStr]) statsByDay[dateStr].energy = e.level
    })

    res.json(Object.values(statsByDay))
  } catch (error) {
    console.error('[Users] Error en getStats:', error)
    res.status(500).json({ message: 'Error al obtener estadísticas' })
  }
}
