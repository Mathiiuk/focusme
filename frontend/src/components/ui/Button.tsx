import React from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import clsx from 'clsx'

// -------------------------------------------------------
// Tipos de variantes del Button
// -------------------------------------------------------
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'adhd'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
}

// Clases base compartidas por todas las variantes
// Touch target mínimo 44x44px garantizado por min-h y min-w
const BASE_CLASSES = [
  'inline-flex items-center justify-center gap-2',
  'font-medium rounded-lg',
  'transition-all duration-150',
  'min-h-[44px] min-w-[44px]',          // WCAG 2.1: touch target mínimo
  'cursor-pointer select-none',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'focus-visible:outline-none',
  // Focus ring visible siempre — crítico para navegación por teclado
  'focus-visible:ring-[3px] focus-visible:ring-offset-2',
].join(' ')

// Mapeo de variante a clases de Tailwind
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Botón primario: acento sobre fondo de color
  primary: [
    'bg-[var(--color-accent)] text-white',
    'hover:bg-[var(--color-accent-hover)]',
    'active:bg-[var(--color-accent-focus)]',
    'focus-visible:ring-[var(--color-focus-ring)]',
  ].join(' '),

  // Botón secundario: borde visible, fondo transparente
  secondary: [
    'bg-transparent text-[var(--color-text-primary)]',
    'border-2 border-[var(--color-border)]',
    'hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
    'focus-visible:ring-[var(--color-focus-ring)]',
  ].join(' '),

  // Botón fantasma: sin borde, fondo en hover
  ghost: [
    'bg-transparent text-[var(--color-text-secondary)]',
    'hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]',
    'focus-visible:ring-[var(--color-focus-ring)]',
  ].join(' '),

  // Botón de peligro: para acciones destructivas
  danger: [
    'bg-[var(--color-error)] text-white',
    'hover:opacity-90 active:opacity-80',
    'focus-visible:ring-[var(--color-error)]',
  ].join(' '),
}

// Mapeo de tamaño a clases
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm:   'text-[14px] px-3 py-2',
  md:   'text-[16px] px-5 py-3',
  lg:   'text-[18px] px-6 py-3.5',
  // Tamaño especial para modo TDAH: enorme, imposible de no ver
  adhd: 'text-[22px] px-10 py-5 rounded-[20px] font-semibold w-full',
}

// -------------------------------------------------------
// Spinner de carga accesible
// -------------------------------------------------------
const Spinner = () => (
  <svg
    aria-hidden="true"
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12" cy="12" r="10"
      stroke="currentColor" strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
)

// -------------------------------------------------------
// Componente Button principal
// -------------------------------------------------------
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // Respetar preferencia de movimiento reducido del usuario
    const shouldReduceMotion = useReducedMotion()

    const classes = clsx(
      BASE_CLASSES,
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      className
    )

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        aria-disabled={disabled || isLoading || undefined}
        // Animación de tap: escala leve al presionar
        whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
        // Sin hover animación: el CSS ya lo maneja más suavemente
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {/* Icono izquierdo o spinner de carga */}
        {isLoading ? <Spinner /> : leftIcon}

        {/* Texto del botón */}
        <span>{children}</span>

        {/* Icono derecho (solo si no está cargando) */}
        {!isLoading && rightIcon}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
