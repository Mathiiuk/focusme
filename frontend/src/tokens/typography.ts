// src/tokens/typography.ts
// Jerarquía tipográfica estricta usando CSS vars del sistema de tokens
// Cada rol tiene un tamaño mínimo verificado para legibilidad TDAH

export const typography = {
  // Títulos de sección — lo primero que el usuario tiene que leer
  // 24px mínimo, semibold, tracking tight para modernidad
  display: 'text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]',

  // Título de tarjeta o elemento principal
  // 18px, peso medio, contraste máximo
  heading: 'text-lg font-medium tracking-tight text-[var(--color-text-primary)]',

  // Texto de cuerpo — legible sin esfuerzo
  // 14px mínimo absoluto (WCAG), line-height generoso (1.625)
  body: 'text-sm font-normal leading-relaxed text-[var(--color-text-secondary)]',

  // Metadatos, timestamps, etiquetas secundarias
  // 12px con contraste reducido — solo para info no crítica
  caption: 'text-xs font-normal text-[var(--color-text-tertiary)]',

  // Labels de formulario
  // 12px con peso 500 para compensar el tamaño reducido
  label: 'text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]',

  // El paso actual en modo TDAH — máxima legibilidad, sin distracciones
  // 20px mínimo, peso medio, leading cómodo
  focus: 'text-xl font-medium leading-snug text-[var(--color-text-primary)]',
};
