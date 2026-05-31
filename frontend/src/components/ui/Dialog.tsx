import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { Button } from './Button'

// -------------------------------------------------------
// Tipos del Dialog
// -------------------------------------------------------
interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  /** Evitar cerrar haciendo click fuera (para diálogos críticos) */
  preventOutsideClose?: boolean
}

/**
 * Diálogo modal accesible con:
 * - role="dialog" y aria-modal="true"
 * - aria-labelledby y aria-describedby
 * - Focus trap: el foco no puede salir del diálogo mientras está abierto
 * - Cierre con Escape
 * - Animación suave que respeta prefers-reduced-motion
 */
export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  preventOutsideClose = false,
}) => {
  // Ref para el contenedor del diálogo (focus trap)
  const dialogRef = useRef<HTMLDivElement>(null)
  // Ref para el elemento que tenía foco antes de abrir el diálogo
  const previousFocusRef = useRef<HTMLElement | null>(null)
  // Respetar preferencia de movimiento reducido
  const shouldReduceMotion = useReducedMotion()

  // IDs únicos para aria
  const titleId = 'dialog-title'
  const descId = 'dialog-desc'

  // Al abrir: guardar foco anterior y mover foco al diálogo
  useEffect(() => {
    if (isOpen) {
      // Guardar referencia al elemento con foco actual
      previousFocusRef.current = document.activeElement as HTMLElement
      // Pequeño delay para asegurar que el DOM está renderizado
      setTimeout(() => {
        dialogRef.current?.focus()
      }, 50)
    } else {
      // Al cerrar: devolver foco al elemento anterior
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      // Cerrar con Escape
      if (e.key === 'Escape' && !preventOutsideClose) {
        onClose()
        return
      }

      // Focus trap: Tab y Shift+Tab no salen del diálogo
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          // Shift+Tab: si estamos en el primer elemento, volver al último
          if (document.activeElement === firstElement || document.activeElement === dialogRef.current) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          // Tab: si estamos en el último elemento, volver al primero
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, preventOutsideClose])

  // Prevenir scroll del body mientras el diálogo está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Variantes de animación para el backdrop y el panel
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  const panelVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12, scale: shouldReduceMotion ? 1 : 0.97 },
    visible: { opacity: 1, y: 0, scale: 1 },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        // Contenedor principal fijo que cubre toda la pantalla y centra el diálogo usando Flexbox (evita fallos de translate y transform)
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Fondo oscuro (backdrop) translúcido y con efecto de desenfoque */}
          <motion.div
            aria-hidden="true" // Oculto para lectores de pantalla por ser puramente estético
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" // Cubre toda la pantalla por debajo del panel
            variants={backdropVariants} // Animación de opacidad
            initial="hidden" // Inicio transparente
            animate="visible" // Entrada a visible
            exit="hidden" // Salida al cerrar
            transition={{ duration: 0.15 }} // Duración suave de la transición
            // Cerrar al hacer click fuera (si está permitido)
            onClick={() => !preventOutsideClose && onClose()}
          />

          {/* Panel del diálogo en posición relativa con ancho máximo y sombra elegante */}
          <motion.div
            ref={dialogRef} // Referencia para controlar el foco de accesibilidad
            role="dialog" // Rol semántico de diálogo
            aria-modal="true" // Indica que es una ventana modal interactiva
            aria-labelledby={titleId} // Vincula el título del diálogo con el modal
            aria-describedby={description ? descId : undefined} // Vincula la descripción con el modal
            // tabIndex -1 permite que el div reciba foco programáticamente
            tabIndex={-1}
            className={clsx(
              'relative z-50 w-full max-w-md', // Posición relativa sobre el fondo, ancho completo y tope en max-w-md
              'bg-[var(--color-bg-surface)] rounded-xl', // Fondo de superficie limpio y esquinas redondeadas
              'shadow-[var(--shadow-large)]', // Sombra grande para efecto elevado premium
              'border border-[var(--color-border)]', // Borde sutil definido en el sistema de diseño
              'outline-none', // Evita el anillo visual por defecto pero mantiene el foco activo
              'p-6' // Relleno generoso de 24px (p-6)
            )}
            variants={panelVariants} // Variantes de animación de desplazamiento y escala suave
            initial="hidden" // Estado inicial oculto
            animate="visible" // Estado visible
            exit="hidden" // Estado de salida
            transition={{ duration: 0.2, ease: 'easeOut' }} // Curva de animación suave y rápida
          >
            {/* Header del diálogo */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2
                  id={titleId}
                  className="text-[18px] font-semibold text-[var(--color-text-primary)] leading-snug"
                >
                  {title}
                </h2>
                {description && (
                  <p
                    id={descId}
                    className="text-[15px] text-[var(--color-text-secondary)] mt-1"
                  >
                    {description}
                  </p>
                )}
              </div>

              {/* Botón de cierre — touch target 44x44px */}
              {!preventOutsideClose && (
                <button
                  onClick={onClose}
                  aria-label="Cerrar diálogo"
                  className={clsx(
                    'flex items-center justify-center',
                    'w-[44px] h-[44px] rounded-md shrink-0',
                    'text-[var(--color-text-secondary)]',
                    'hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-[3px]',
                    'focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
                  )}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Contenido del diálogo */}
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// -------------------------------------------------------
// Pie del diálogo con botones de acción
// -------------------------------------------------------
interface DialogFooterProps {
  onConfirm?: () => void
  onCancel?: () => void
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  confirmVariant?: 'primary' | 'danger'
}

export const DialogFooter: React.FC<DialogFooterProps> = ({
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  confirmVariant = 'primary',
}) => (
  <div className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
    {onCancel && (
      <Button variant="secondary" onClick={onCancel} className="flex-1">
        {cancelLabel}
      </Button>
    )}
    {onConfirm && (
      <Button
        variant={confirmVariant}
        onClick={onConfirm}
        isLoading={isLoading}
        className="flex-1"
      >
        {confirmLabel}
      </Button>
    )}
  </div>
)

export default Dialog
