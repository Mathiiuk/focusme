import { useReducedMotion } from 'framer-motion';

// -------------------------------------------------------
// Hook centralizado para todas las animaciones de la app.
// Respeta prefers-reduced-motion del sistema operativo.
// Duraciones máximas: 300ms transiciones, 600ms celebraciones, 150ms hover/focus.
// NUNCA animar height, width, margin o padding — solo transform y opacity.
// -------------------------------------------------------
export function useMotion() {
  const shouldReduce = useReducedMotion();

  return {
    // Booleano para condicionar lógica en componentes
    reducedMotion: shouldReduce,

    // Si prefiere poco movimiento, las transiciones duran 0s
    transition: shouldReduce ? { duration: 0 } : undefined,
    animate: shouldReduce ? {} : undefined,

    // --- Variantes de animación estándar ---

    // Entrada de elementos (componente aparece en pantalla)
    enter: shouldReduce
      ? { opacity: 1 }
      : { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } },

    // Estado inicial antes de entrar (para usar con "initial")
    enterFrom: shouldReduce
      ? { opacity: 0 }
      : { opacity: 0, y: 8 },

    // Salida de elementos (componente se va de la pantalla)
    exit: shouldReduce
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },

    // Micro-celebración (tarea completada, logro desbloqueado)
    // Max 600ms para no ser intrusiva
    celebrate: shouldReduce
      ? { scale: 1 }
      : { scale: [1, 1.04, 1], transition: { duration: 0.3 } },

    // --- Transiciones reutilizables ---
    enterTransition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const },
    exitTransition: { duration: 0.15, ease: [0.55, 0, 1, 0.45] as const },
    tapTransition: { duration: 0.1, ease: 'easeOut' as const },
  };
}
