// Tipos compartidos de FocusFlow AI
// Estos tipos reflejan directamente el esquema de la base de datos

// -------------------------------------------------------
// Enums del dominio
// -------------------------------------------------------

/** Estado posible de un objetivo o tarea */
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ARCHIVED'

/** Estado posible de una tarea o sub-tarea */
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'

/** Razones de bloqueo detectadas por el sistema */
export type BlockReason =
  | 'DONT_KNOW_HOW_TO_START'
  | 'DONT_UNDERSTAND'
  | 'TOO_BIG'
  | 'DISTRACTED'

// -------------------------------------------------------
// Entidades principales
// -------------------------------------------------------

/** Usuario autenticado */
export interface User {
  id: string
  email: string
  name: string | null
  timezone: string
  level: number          // nivel actual de gamificación
  xp: number             // puntos de experiencia acumulados
  streakDays: number     // días consecutivos de uso
  createdAt: string
}

/** Objetivo del usuario con sus tareas anidadas */
export interface Goal {
  id: string
  userId: string
  title: string
  description: string | null
  status: GoalStatus
  clsScore: number | null   // Cognitive Load Score (Fase 2)
  fibonacciValue: number | null
  createdAt: string
  completedAt: string | null
  tasks: Task[]
}

/** Tarea dentro de un objetivo */
export interface Task {
  id: string
  goalId: string
  title: string
  description: string | null
  status: TaskStatus
  clsScore: number | null
  fibonacciValue: number | null
  order: number
  createdAt: string
  completedAt: string | null
  subtasks: Subtask[]
}

/** Micro-acción de 1-5 minutos dentro de una tarea */
export interface Subtask {
  id: string
  taskId: string
  title: string           // la acción en texto claro y ejecutable
  status: TaskStatus
  durationMinutes: number | null
  order: number
  createdAt: string
  completedAt: string | null
}

/** Registro de nivel de energía diaria */
export interface EnergyLog {
  id: string
  userId: string
  level: number           // 1-5: nivel de energía
  recordedAt: string
}

/** Evento de bloqueo del usuario */
export interface BlockEvent {
  id: string
  userId: string
  taskId: string | null
  reason: BlockReason
  durationMinutes: number | null
  resolution: string | null
  resolvedAt: string | null
  createdAt: string
}

// -------------------------------------------------------
// Respuestas de la IA
// -------------------------------------------------------

/** Respuesta estructurada del motor de descomposición */
export interface DecompositionResponse {
  summary: string           // objetivo resumido en una oración
  nextAction: string        // la primera micro-acción específica
  estimatedMinutes: number  // tiempo total estimado
  complexity: 1 | 2 | 3 | 4 | 5  // complejidad percibida
  phases: DecompositionPhase[]
}

/** Una fase dentro de la descomposición */
export interface DecompositionPhase {
  title: string
  tasks: DecompositionTask[]
}

/** Una tarea dentro de una fase de la descomposición */
export interface DecompositionTask {
  title: string
  subtasks: string[]        // micro-acciones de 1-5 minutos
}

// -------------------------------------------------------
// Payloads de API
// -------------------------------------------------------

/** Payload para crear un objetivo nuevo */
export interface CreateGoalPayload {
  input: string             // texto libre del usuario
}

/** Payload de respuesta de autenticación */
export interface AuthResponse {
  user: User
  accessToken: string
}

/** Payload de registro */
export interface RegisterPayload {
  email: string
  password: string
}

/** Payload de login */
export interface LoginPayload {
  email: string
  password: string
}

/** Payload de onboarding post-registro */
export interface OnboardingPayload {
  name: string
  timezone: string
}

// -------------------------------------------------------
// Estado de la UI
// -------------------------------------------------------

/** Estado del dashboard: vacío o con objetivo activo */
export type DashboardState = 'empty' | 'active' | 'loading'

/** Estado del modo TDAH */
export interface AdhdModeState {
  goalId: string
  currentSubtaskIndex: number
  subtasks: Subtask[]
  showCelebration: boolean
}

/** Mensajes del chat del coach */
export interface CoachMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}
