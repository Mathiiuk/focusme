import React from 'react'
import clsx from 'clsx'

// -------------------------------------------------------
// Tipos del componente Input
// -------------------------------------------------------
interface InputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  isLarge?: boolean  // versión grande para el dashboard principal
}

/**
 * Componente de entrada de texto accesible.
 * Usa <textarea> en lugar de <input> para permitir objetivos largos.
 * Siempre incluye label visible o aria-label para lectores de pantalla.
 */
export const GoalTextarea = React.forwardRef<HTMLTextAreaElement, InputProps>(
  ({ label, error, hint, isLarge = false, className, id, ...props }, ref) => {
    // Generar ID único si no se provee (necesario para asociar label)
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 7)}`
    const hintId = hint ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined

    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Label visible — siempre presente para accesibilidad */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-[var(--color-text-secondary)] text-[14px] font-medium"
          >
            {label}
          </label>
        )}

        {/* Campo de texto */}
        <textarea
          ref={ref}
          id={inputId}
          // Asociar mensajes de ayuda y error al campo para lectores de pantalla
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : undefined}
          className={clsx(
            // Base: fondo de superficie, borde suave
            'w-full resize-none rounded-md border transition-colors duration-150',
            'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]',
            'placeholder:text-[var(--color-text-placeholder)]',
            // Borde normal
            'border-[var(--color-border)]',
            // Borde en focus — sin outline nativo, usamos ring de Tailwind
            'focus:outline-none focus:border-[var(--color-accent)]',
            'focus:ring-[3px] focus:ring-[var(--color-focus-ring)] focus:ring-offset-0',
            // Borde de error
            error && 'border-[var(--color-error)] focus:ring-[var(--color-error)]',
            // Tamaño según modo
            isLarge
              ? 'text-[18px] leading-relaxed px-5 py-4 min-h-[120px]'
              : 'text-[16px] px-4 py-3 min-h-[80px]',
            className
          )}
          {...props}
        />

        {/* Mensaje de ayuda contextual */}
        {hint && !error && (
          <p id={hintId} className="text-[14px] text-[var(--color-text-secondary)]">
            {hint}
          </p>
        )}

        {/* Mensaje de error — rol alert para anunciar a lectores de pantalla */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-[14px] text-[var(--color-error)] flex items-center gap-1"
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
      </div>
    )
  }
)

GoalTextarea.displayName = 'GoalTextarea'

// -------------------------------------------------------
// Input de texto simple (para formularios de auth)
// -------------------------------------------------------
interface SimpleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, SimpleInputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 7)}`
    const hintId = hint ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label siempre visible */}
        <label
          htmlFor={inputId}
          className="text-[var(--color-text-primary)] text-[15px] font-medium"
        >
          {label}
        </label>

        <input
          ref={ref}
          id={inputId}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : undefined}
          className={clsx(
            'w-full rounded-md border px-4 py-3',
            'text-[16px] text-[var(--color-text-primary)]',
            'bg-[var(--color-bg-surface)]',
            'placeholder:text-[var(--color-text-placeholder)]',
            'border-[var(--color-border)]',
            // Touch target mínimo: height de 44px
            'min-h-[44px]',
            'transition-colors duration-150',
            'focus:outline-none focus:border-[var(--color-accent)]',
            'focus:ring-[3px] focus:ring-[var(--color-focus-ring)] focus:ring-offset-0',
            error && 'border-[var(--color-error)] focus:ring-[var(--color-error)]',
            className
          )}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="text-[13px] text-[var(--color-text-secondary)]">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="text-[13px] text-[var(--color-error)]">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
