/** @type {import('tailwindcss').Config} */
export default {
  // Archivos donde Tailwind buscará clases para purgar en producción
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Activar dark mode según preferencia del sistema operativo
  darkMode: 'media',
  theme: {
    extend: {
      // Familia tipográfica principal: Inter para legibilidad
      fontFamily: {
        sans: ['Inter', 'Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
      },
      // Paleta de colores personalizada validada para daltonismo
      colors: {
        // Fondos
        'bg-primary': 'var(--color-bg-primary)',
        'bg-surface': 'var(--color-bg-surface)',
        'bg-muted': 'var(--color-bg-muted)',
        // Textos
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-disabled': 'var(--color-text-disabled)',
        // Acento principal (azul-índigo accesible)
        'accent': 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-focus': 'var(--color-accent-focus)',
        // Estados semánticos
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'error': 'var(--color-error)',
      },
      // Tamaños de fuente según tokens de diseño
      fontSize: {
        'body': ['16px', { lineHeight: '1.6' }],
        'action': ['18px', { lineHeight: '1.5' }],
        'adhd': ['24px', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        'h1': ['28px', { lineHeight: '1.3', fontWeight: '700' }],
        'h2': ['22px', { lineHeight: '1.4', fontWeight: '600' }],
      },
      // Espaciado basado en tokens
      spacing: {
        'touch': '44px', // mínimo WCAG 2.1 para touch targets
      },
      // Border radius redondeados para reducir tensión visual
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '20px',
        'xl': '32px',
      },
      // Sombras suaves, sin bordes duros
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.06)',
        'medium': '0 4px 16px rgba(0,0,0,0.10)',
        'focus': '0 0 0 3px var(--color-focus-ring)',
      },
      // Animaciones: siempre con duración corta y respeto a prefers-reduced-motion
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'celebrate': 'celebrate 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        celebrate: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
