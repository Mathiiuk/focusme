// -------------------------------------------------------
// Mensajes de error centralizados en lenguaje humano
// Estructura: qué pasó + tranquilidad + acción
// Nunca mostrar códigos de error, stack traces o mensajes técnicos
// -------------------------------------------------------

// Interfaz del error enriquecido que lanza apiFetch
export interface AppError extends Error {
  status?: number
  code?: string
}

// Mapa de códigos de error a mensajes amigables
const errorMessages: Record<string, string> = {
  // ---- Red / Conexión ----
  'ERR_NETWORK':        'No hay conexión a internet. Revisá tu WiFi y volvé a intentarlo.',
  'ERR_TIMEOUT':        'Esto tardó más de lo esperado. ¿Intentamos de nuevo?',
  'Failed to fetch':    'No pudimos conectar con el servidor. Tu progreso está guardado.',

  // ---- Autenticación ----
  'AUTH_INVALID':       'El email o la contraseña no coinciden. Fijate bien y probá de nuevo.',
  'AUTH_EXPIRED':       'Tu sesión venció. Ingresá de nuevo — no perdiste nada.',
  'AUTH_RATE_LIMIT':    'Demasiados intentos. Esperá un minuto y volvé a intentarlo.',

  // ---- IA / Backend ----
  'AI_UNAVAILABLE':     'La IA no está disponible ahora mismo. Podés escribir tu objetivo igual y volvemos más tarde.',
  'AI_TIMEOUT':         'La IA tardó demasiado. Tu texto está guardado, ¿intentamos de nuevo?',

  // ---- HTTP status codes ----
  '400':                'Algo no está bien con los datos. Revisá lo que escribiste.',
  '401':                'Tu sesión expiró. Ingresá de nuevo para continuar.',
  '403':                'No tenés permiso para hacer esto.',
  '404':                'No encontramos lo que buscabas. Puede que ya no exista.',
  '429':                'Muchas solicitudes seguidas. Esperá unos segundos.',
  '500':                'Algo salió mal de nuestro lado. Estamos en eso.',
  '502':                'El servidor no responde. Probá de nuevo en unos segundos.',
  '503':                'El servicio está temporalmente fuera de línea. Volvé pronto.',

  // ---- Genérico ----
  'UNKNOWN':            'Algo salió mal. Tu progreso está guardado. Recargá la página si el problema sigue.',
}

/**
 * Convierte un error técnico en un mensaje amigable para el usuario.
 * Busca por código de error, luego por status HTTP, y finalmente usa el genérico.
 */
export function getDisplayError(error: unknown): string {
  // Si es un Error con código propio
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as AppError).code
    if (code && errorMessages[code]) return errorMessages[code]
  }

  // Si tiene status HTTP
  if (error && typeof error === 'object' && 'status' in error) {
    const status = String((error as AppError).status)
    if (errorMessages[status]) return errorMessages[status]
  }

  // Si es un Error con mensaje conocido
  if (error instanceof Error) {
    // Buscar mensajes de red comunes
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return errorMessages['ERR_NETWORK']
    }
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return errorMessages['ERR_TIMEOUT']
    }
    // Si el backend mandó un mensaje legible (no técnico), usarlo
    if (error.message && !error.message.includes('Error') && error.message.length < 200) {
      return error.message
    }
  }

  // Fallback genérico
  return errorMessages['UNKNOWN']
}
