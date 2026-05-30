import { useEffect, useRef, useCallback } from 'react'

// -------------------------------------------------------
// Hook: useBlockDetection
// Detecta inactividad del usuario por más de 10 minutos
// y dispara el diálogo de bloqueo de forma suave
// -------------------------------------------------------

/** Tiempo en ms antes de considerar bloqueo: 10 minutos */
const BLOCK_TIMEOUT_MS = 10 * 60 * 1000

/**
 * Eventos que indican que el usuario está activo.
 * Cualquiera de estos resetea el temporizador.
 */
const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
] as const

interface UseBlockDetectionOptions {
  /** Si está en false, el detector no funciona (ej: cuando el diálogo ya está abierto) */
  enabled?: boolean
  /** Callback que se llama cuando se detecta inactividad */
  onBlock: () => void
}

export function useBlockDetection({
  enabled = true,
  onBlock,
}: UseBlockDetectionOptions) {
  // Referencia al timer para poder limpiarlo
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Referencia estable al callback para no necesitarlo como dep del effect
  const onBlockRef = useRef(onBlock)
  onBlockRef.current = onBlock

  // Función para resetear el temporizador de inactividad
  const resetTimer = useCallback(() => {
    // Limpiar timer anterior si existe
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    // Iniciar nuevo timer de 10 minutos
    timerRef.current = setTimeout(() => {
      onBlockRef.current()
    }, BLOCK_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    // Si el detector está desactivado, limpiar y salir
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Iniciar el timer al activarse
    resetTimer()

    // Añadir listeners de actividad del usuario
    ACTIVITY_EVENTS.forEach((event) => {
      // Uso de { passive: true } para no bloquear el scroll
      window.addEventListener(event, resetTimer, { passive: true })
    })

    // Limpiar al desmontar el componente
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetTimer)
      })
    }
  }, [enabled, resetTimer])
}

export default useBlockDetection
