// Controller de eventos de bloqueo
// Registra y gestiona los momentos de bloqueo del usuario

import { Request, Response } from 'express'
import { PrismaClient, BlockReason } from '@prisma/client'
import { getBlockHelp } from '../services/openai.service'

const prisma = new PrismaClient()

// Función auxiliar: extraer param como string puro (nunca string[])
function getParam(req: Request, name: string): string {
  return String(req.params[name])
}

// -------------------------------------------------------
// POST /api/v1/blocks
// Registrar un evento de bloqueo y obtener ayuda de la IA
// -------------------------------------------------------
export async function createBlock(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id
  if (!userId) { res.status(401).json({ message: 'No autorizado' }); return }

  const { taskId, reason } = req.body

  // Validar que el reason es un valor válido del enum
  const validReasons: BlockReason[] = [
    'DONT_KNOW_HOW_TO_START',
    'DONT_UNDERSTAND',
    'TOO_BIG',
    'DISTRACTED',
  ]
  if (!validReasons.includes(reason)) {
    res.status(400).json({ message: 'Razón de bloqueo no válida' })
    return
  }

  try {
    // Obtener el título de la tarea para el contexto de la IA
    let taskTitle = 'la tarea actual'
    if (taskId) {
      const task = await prisma.task.findFirst({
        where: { id: taskId },
        select: { title: true },
      })
      if (task) taskTitle = task.title
    }

    // Obtener respuesta empática de la IA para este tipo de bloqueo
    const aiResponse = await getBlockHelp(reason as BlockReason, taskTitle)

    // Registrar el evento de bloqueo en la base de datos
    const blockEvent = await prisma.blockEvent.create({
      data: {
        userId,
        taskId: taskId ?? null,
        reason: reason as BlockReason,
      },
    })

    // Devolver el ID del bloqueo y la respuesta de la IA
    res.status(201).json({ id: blockEvent.id, aiResponse })
  } catch (error) {
    console.error('[Blocks] Error al registrar bloqueo:', error)
    res.status(500).json({ message: 'Error al procesar el bloqueo' })
  }
}

// -------------------------------------------------------
// PATCH /api/v1/blocks/:id/resolve
// Marcar un bloqueo como resuelto
// -------------------------------------------------------
export async function resolveBlock(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id
  // getParam garantiza string puro (req.params puede ser string | string[])
  const id = getParam(req, 'id')
  const { resolution } = req.body

  if (!userId) { res.status(401).json({ message: 'No autorizado' }); return }

  try {
    // Verificar que el bloqueo pertenece al usuario
    const block = await prisma.blockEvent.findFirst({ where: { id, userId } })
    if (!block) {
      res.status(404).json({ message: 'Evento de bloqueo no encontrado' })
      return
    }

    const resolved = await prisma.blockEvent.update({
      where: { id },
      data: {
        resolution: resolution ?? 'resuelto',
        resolvedAt: new Date(),
        // Calcular duración del bloqueo
        durationMinutes: Math.round(
          (Date.now() - block.createdAt.getTime()) / 60000
        ),
      },
    })

    res.json(resolved)
  } catch (error) {
    console.error('[Blocks] Error al resolver bloqueo:', error)
    res.status(500).json({ message: 'Error al resolver el bloqueo' })
  }
}
