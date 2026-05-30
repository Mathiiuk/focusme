import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Goal, Subtask, DashboardState, AdhdModeState } from '@/types'

// -------------------------------------------------------
// Store de autenticación
// Persiste en localStorage para mantener sesión
// -------------------------------------------------------
interface AuthStore {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  // Acción: guardar usuario y token al hacer login
  setAuth: (user: User, token: string) => void
  // Acción: limpiar estado al hacer logout
  clearAuth: () => void
  // Acción: actualizar datos del usuario (ej. después del onboarding)
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      // Guardar sesión completa
      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),

      // Limpiar todo al desloguearse
      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),

      // Actualizar campos del usuario sin reemplazar todo
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      // Nombre de la clave en localStorage
      name: 'focusflow-auth',
      // Solo persistir token y user, no el estado derivado
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// -------------------------------------------------------
// Store del dashboard
// Estado de la pantalla principal
// -------------------------------------------------------
interface DashboardStore {
  state: DashboardState
  currentGoal: Goal | null
  inputValue: string
  // Acciones
  setState: (state: DashboardState) => void
  setCurrentGoal: (goal: Goal | null) => void
  setInputValue: (value: string) => void
  reset: () => void
}

export const useDashboardStore = create<DashboardStore>()((set) => ({
  state: 'empty',
  currentGoal: null,
  inputValue: '',

  setState: (state) => set({ state }),
  setCurrentGoal: (currentGoal) => set({ currentGoal }),
  setInputValue: (inputValue) => set({ inputValue }),

  // Volver al estado inicial (campo vacío)
  reset: () => set({ state: 'empty', currentGoal: null, inputValue: '' }),
}))

// -------------------------------------------------------
// Store del modo TDAH
// Gestiona el flujo de micro-acciones en modo de enfoque
// -------------------------------------------------------
interface AdhdStore {
  isActive: boolean
  state: AdhdModeState | null
  // Activar modo TDAH con una lista de subtareas
  activate: (goalId: string, subtasks: Subtask[]) => void
  // Marcar la subtarea actual como completada y avanzar
  completeCurrentSubtask: () => void
  // Mostrar o esconder la celebración
  setShowCelebration: (show: boolean) => void
  // Desactivar modo TDAH
  deactivate: () => void
}

export const useAdhdStore = create<AdhdStore>()((set) => ({
  isActive: false,
  state: null,

  activate: (goalId, subtasks) =>
    set({
      isActive: true,
      state: {
        goalId,
        subtasks,
        currentSubtaskIndex: 0,
        showCelebration: false,
      },
    }),

  completeCurrentSubtask: () =>
    set((store) => {
      if (!store.state) return store
      const nextIndex = store.state.currentSubtaskIndex + 1
      const isLast = nextIndex >= store.state.subtasks.length
      return {
        state: {
          ...store.state,
          currentSubtaskIndex: isLast ? store.state.currentSubtaskIndex : nextIndex,
          showCelebration: true,
        },
        // Si era la última, desactivar el modo al terminar la celebración
        isActive: isLast ? store.isActive : true,
      }
    }),

  setShowCelebration: (show) =>
    set((store) => ({
      state: store.state ? { ...store.state, showCelebration: show } : null,
    })),

  deactivate: () => set({ isActive: false, state: null }),
}))

// -------------------------------------------------------
// Store de configuración de la app
// Preferencias del usuario
// -------------------------------------------------------
interface AppConfigStore {
  speechEnabled: boolean  // texto en voz alta en modo TDAH
  toggleSpeech: () => void
}

export const useAppConfigStore = create<AppConfigStore>()(
  persist(
    (set) => ({
      speechEnabled: false,

      toggleSpeech: () =>
        set((state) => ({ speechEnabled: !state.speechEnabled })),
    }),
    { name: 'focusflow-config' }
  )
)
