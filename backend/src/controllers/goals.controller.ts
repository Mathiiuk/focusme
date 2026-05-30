// Controller de objetivos (goals)
// Maneja la creación, consulta y actualización de objetivos
// La creación dispara la descomposición con IA

import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { decomposeGoal } from '../services/openai.service'

const prisma = new PrismaClient()

// -------------------------------------------------------
// Función auxiliar: extraer ID de req.params como string puro
// Express tipea req.params como ParamsDictionary (string | string[])
// pero en rutas simples siempre es string — el cast es seguro
// -------------------------------------------------------
function getParam(req: Request, name: string): string {
  return String(req.params[name])
}

// -------------------------------------------------------
// POST /api/v1/goals
// Crear objetivo y descomponer con IA en tareas y subtareas
// -------------------------------------------------------
export async function createGoal(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ message: 'No autorizado' })
    return
  }

  const { input } = req.body
  if (!input || input.trim().length < 5) {
    res.status(400).json({ message: 'Describí tu objetivo con un poco más de detalle' })
    return
  }

  try {
    // Obtener nivel de energía del día si está disponible (Fase 2)
    const latestEnergy = await prisma.energyLog.findFirst({
      where: {
        userId,
        // Solo considerar el registro de hoy
        recordedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      orderBy: { recordedAt: 'desc' },
    })

    // Llamar al motor de IA para descomponer el objetivo
    const decomposition = await decomposeGoal(input.trim(), latestEnergy?.level)

    // Usar una transacción de Prisma para crear todo de forma atómica
    // Si algo falla, ningún registro parcial queda en la DB
    const goal = await prisma.$transaction(async (tx) => {
      // 1. Crear el objetivo principal
      const newGoal = await tx.goal.create({
        data: {
          userId,
          title: decomposition.summary,
          description: input.trim(), // guardar el texto original
          status: 'ACTIVE',
        },
      })

      // 2. Crear cada fase como una Task, con sus subtareas
      for (let phaseIdx = 0; phaseIdx < decomposition.phases.length; phaseIdx++) {
        const phase = decomposition.phases[phaseIdx]

        for (let taskIdx = 0; taskIdx < phase.tasks.length; taskIdx++) {
          const taskData = phase.tasks[taskIdx]

          // Crear la tarea (fase)
          const task = await tx.task.create({
            data: {
              goalId: newGoal.id,
              title: taskData.title,
              // El orden se calcula por fase × máximo tareas + índice dentro de la fase
              order: phaseIdx * 10 + taskIdx,
              status: 'PENDING',
            },
          })

          // Crear cada micro-acción como Subtask
          for (let subIdx = 0; subIdx < taskData.subtasks.length; subIdx++) {
            await tx.subtask.create({
              data: {
                taskId: task.id,
                title: taskData.subtasks[subIdx],
                order: subIdx,
                // Estimar tiempo basado en la complejidad total
                durationMinutes: Math.ceil(decomposition.estimatedMinutes / (decomposition.phases.length * 3)),
                status: 'PENDING',
              },
            })
          }
        }
      }

      // 3. Devolver el objetivo completo con todas sus relaciones
      return tx.goal.findUnique({
        where: { id: newGoal.id },
        include: {
          tasks: {
            orderBy: { order: 'asc' },
            include: {
              subtasks: { orderBy: { order: 'asc' } },
            },
          },
        },
      })
    })

    res.status(201).json(goal)
  } catch (error) {
    console.error('[Goals] Error al crear objetivo:', error)
    res.status(500).json({ message: 'Error al procesar tu objetivo — intentá de nuevo' })
  }
}

// -------------------------------------------------------
// GET /api/v1/goals
// Listar objetivos del usuario
// -------------------------------------------------------
export async function getGoals(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id
  if (!userId) { res.status(401).json({ message: 'No autorizado' }); return }

  const { status } = req.query

  try {
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        // Filtrar por estado si se especifica, sino devolver todos
        ...(status ? { status: status as any } : {}),
      },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
          include: {
            subtasks: { orderBy: { order: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(goals)
  } catch (error) {
    console.error('[Goals] Error al obtener objetivos:', error)
    res.status(500).json({ message: 'Error al obtener los objetivos' })
  }
}

// -------------------------------------------------------
// GET /api/v1/goals/:id
// Obtener un objetivo específico con sus tareas
// -------------------------------------------------------
export async function getGoalById(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id
  // getParam garantiza que id sea string (nunca string[])
  const id = getParam(req, 'id')

  if (!userId) { res.status(401).json({ message: 'No autorizado' }); return }

  try {
    const goal = await prisma.goal.findFirst({
      where: { id, userId }, // asegurar que pertenece al usuario
      include: {
        tasks: {
          orderBy: { order: 'asc' },
          include: {
            subtasks: { orderBy: { order: 'asc' } },
          },
        },
      },
    })

    if (!goal) {
      res.status(404).json({ message: 'Objetivo no encontrado' })
      return
    }

    res.json(goal)
  } catch (error) {
    console.error('[Goals] Error al obtener objetivo:', error)
    res.status(500).json({ message: 'Error al obtener el objetivo' })
  }
}

// -------------------------------------------------------
// PATCH /api/v1/goals/:id/complete
// Marcar objetivo como completado y otorgar XP
// -------------------------------------------------------
export async function completeGoal(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id
  const id = getParam(req, 'id')

  if (!userId) { res.status(401).json({ message: 'No autorizado' }); return }

  try {
    const goal = await prisma.goal.findFirst({ where: { id, userId } })
    if (!goal) {
      res.status(404).json({ message: 'Objetivo no encontrado' })
      return
    }

    // Completar el objetivo y otorgar 100 XP al usuario en una transacción
    const [updatedGoal] = await prisma.$transaction([
      prisma.goal.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      }),
      // Sumar 100 XP por completar un objetivo completo
      prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: 100 } },
      }),
    ])

    res.json(updatedGoal)
  } catch (error) {
    console.error('[Goals] Error al completar objetivo:', error)
    res.status(500).json({ message: 'Error al marcar el objetivo como completado' })
  }
}

// -------------------------------------------------------
// PATCH /api/v1/subtasks/:id/complete
// Marcar micro-acción como completada y otorgar 5 XP
// -------------------------------------------------------
export async function completeSubtask(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id
  const id = getParam(req, 'id')

  if (!userId) { res.status(401).json({ message: 'No autorizado' }); return }

  try {
    // Verificar que la subtarea pertenece al usuario a través de las relaciones
    const subtask = await prisma.subtask.findFirst({
      where: { id },
      include: {
        task: {
          // Solo traer el userId del goal para verificar propiedad
          include: { goal: { select: { userId: true } } },
        },
      },
    })

    // Verificar propiedad: subtarea → tarea → objetivo debe pertenecer al usuario
    if (!subtask || subtask.task.goal.userId !== userId) {
      res.status(404).json({ message: 'Paso no encontrado' })
      return
    }

    // Actualizar subtarea y sumar XP en una transacción
    const [updatedSubtask] = await prisma.$transaction([
      prisma.subtask.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      }),
      // 5 XP por cada micro-acción completada
      prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: 5 } },
      }),
    ])

    res.json(updatedSubtask)
  } catch (error) {
    console.error('[Goals] Error al completar subtarea:', error)
    res.status(500).json({ message: 'Error al marcar el paso como completado' })
  }
}
