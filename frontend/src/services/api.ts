/// <reference types="vite/client" />
// Capa de servicios: todas las llamadas a la API del backend
// Centralizar aquí evita duplicar la lógica de fetch en los componentes

import type {
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  OnboardingPayload,
  User,
  Goal,
  CreateGoalPayload,
  BlockReason,
} from '@/types'

// URL base de la API: en desarrollo usa el proxy de Vite, en producción usa la variable de entorno
const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

// -------------------------------------------------------
// Función auxiliar para hacer fetch con manejo de errores
// -------------------------------------------------------
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Leer el token desde localStorage (puesto por Zustand/persist)
  const stored = localStorage.getItem('focusflow-auth')
  const token = stored ? JSON.parse(stored)?.state?.accessToken : null

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Incluir token JWT si está disponible
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include', // para enviar cookies de refresh token
  })

  if (!response.ok) {
    // Extraer mensaje de error del backend si está disponible
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message ?? `Error ${response.status}`)
  }

  return response.json()
}

// -------------------------------------------------------
// Servicios de autenticación
// -------------------------------------------------------
export interface UserProfile {
  id: string
  email: string
  name?: string
  level: number
  xp: number
  streakDays: number
  graceDaysUsed: number
  energyLogs: EnergyLog[]
}

export interface CompleteSubtaskResponse {
  id: string
  status: string
  leveledUp?: boolean
  xp?: number
  level?: number
}

export interface DailyStat {
  date: string
  label: string
  tasks: number
  energy: number | null
}

export const authService = {
  /** Registrar usuario nuevo con email y contraseña */
  register: (payload: RegisterPayload) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Iniciar sesión */
  login: (payload: LoginPayload) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Cerrar sesión e invalidar refresh token */
  logout: () =>
    apiFetch<void>('/auth/logout', { method: 'POST' }),

  /** Completar onboarding post-registro */
  completeOnboarding: (payload: OnboardingPayload) =>
    apiFetch<User>('/auth/onboarding', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
}

// -------------------------------------------------------
// Servicios de objetivos
// -------------------------------------------------------
export const goalService = {
  /** Crear objetivo nuevo: envía texto libre, la IA lo descompone */
  create: (payload: CreateGoalPayload) =>
    apiFetch<Goal>('/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Obtener objetivo con todas sus tareas y subtareas */
  getById: (id: string) =>
    apiFetch<Goal>(`/goals/${id}`),

  /** Listar todos los objetivos activos del usuario */
  getActive: () =>
    apiFetch<Goal[]>('/goals?status=ACTIVE'),

  /** Marcar objetivo como completado */
  complete: (id: string) =>
    apiFetch<Goal>(`/goals/${id}/complete`, { method: 'PATCH' }),

  /** Marcar micro-acción como completada */
  completeSubtask: (subtaskId: string) =>
    apiFetch<CompleteSubtaskResponse>(`/subtasks/${subtaskId}/complete`, { method: 'PATCH' }),
}

// -------------------------------------------------------
// Servicios de tareas y subtareas
// -------------------------------------------------------
export const taskService = {
  /** Marcar subtarea como completada */
  completeSubtask: (subtaskId: string) =>
    apiFetch<CompleteSubtaskResponse>(`/subtasks/${subtaskId}/complete`, { method: 'PATCH' }),

  /** Obtener ayuda de la IA para una subtarea específica */
  getHelp: (subtaskId: string, reason: string) =>
    apiFetch<{ message: string }>(`/subtasks/${subtaskId}/help`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
}

// -------------------------------------------------------
// Servicios de bloqueos
// -------------------------------------------------------
export const blockService = {
  /** Registrar un evento de bloqueo */
  logBlock: (taskId: string | null, reason: BlockReason) =>
    apiFetch<{ id: string; aiResponse: string }>('/blocks', {
      method: 'POST',
      body: JSON.stringify({ taskId, reason }),
    }),

  /** Marcar un bloqueo como resuelto */
  resolve: (blockId: string, resolution: string) =>
    apiFetch<void>(`/blocks/${blockId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution }),
    }),
}

// -------------------------------------------------------
// Servicios de usuario (Fase 2)
// -------------------------------------------------------
export const userService = {
  /** Obtener el perfil del usuario actual (nivel, XP, logs de energía) */
  getMe: () =>
    apiFetch<UserProfile>('/users/me'),

  /** Registrar el nivel de energía diario (1-5) */
  logEnergy: (level: number) =>
    apiFetch<EnergyLog>('/energy', { 
      method: 'POST',
      body: JSON.stringify({ level }) 
    }),

  /** Obtener estadísticas semanales */
  getStats: () =>
    apiFetch<DailyStat[]>('/stats'),
}

// -------------------------------------------------------
// Servicios de Coach Cognitivo (Fase 2)
// -------------------------------------------------------
export const chatService = {
  /** Enviar mensaje al coach y recibir respuesta */
  sendMessage: (message: string) =>
    apiFetch<{ reply: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    })
}

// -------------------------------------------------------
// Health check (para verificar que el backend está vivo)
// -------------------------------------------------------
export const checkHealth = () =>
  apiFetch<{ status: string; timestamp: string }>('/health')
