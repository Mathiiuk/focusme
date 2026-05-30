import { Request, Response } from 'express'
import { generateCoachResponse } from '../services/openai.service'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// -------------------------------------------------------
// POST /api/v1/chat
// Coach cognitivo conversacional
// -------------------------------------------------------
export async function chatWithCoach(req: Request, res: Response) {
  try {
    // Si bien puede funcionar sin auth en un futuro, por ahora requerimos usuario
    const userId = req.user?.id
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ message: 'El mensaje no puede estar vacío.' })
    }

    let context = ''
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user) {
        context = `Nivel: ${user.level}, XP: ${user.xp}, Racha: ${user.streakDays} días.`
      }
    }

    const reply = await generateCoachResponse(message, context)
    
    res.json({ reply })
  } catch (error) {
    console.error('[Chat] Error al procesar mensaje:', error)
    res.status(500).json({ message: 'Error interno del coach cognitivo.' })
  }
}
