import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles, Brain, Clock, Trophy, Zap } from 'lucide-react'
import AuthPage from '@/pages/AuthPage'

// -------------------------------------------------------
// Componente LandingPage: Página de presentación principal
// Adaptado para aprovechar mejor el espacio en desktop (max-w-7xl, gaps amplios)
// y mantener un diseño de alto nivel sin scrollbar (h-screen overflow-hidden)
// -------------------------------------------------------
const LandingPage: React.FC = () => {
  // Consultar si el usuario tiene activado "Reducir movimiento" en la accesibilidad de su SO
  const shouldReduceMotion = useReducedMotion()

  return (
    <div 
      // h-screen y overflow-hidden en LG (escritorio) para evitar que aparezcan barras de scroll verticales molestos
      className="relative w-full min-h-screen lg:h-screen lg:overflow-hidden flex flex-col justify-center items-center py-8 px-4 md:px-12"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      {/* ------------------------------------------------------- */}
      {/* CAPA DE DISEÑO PREMIUM: ORBES DE LUZ AURORA (BACKGROUND GLOW) */}
      {/* ------------------------------------------------------- */}
      
      {/* Orbe decorativo superior izquierdo: tonalidad púrpura FocusFlow */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }}
      />
      
      {/* Orbe decorativo inferior derecho: tonalidad azul de apoyo */}
      <div 
        className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] pointer-events-none opacity-15"
        style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
      />

      {/* Contenedor central responsivo: ampliado a max-w-7xl y con mayor separación (gap) en desktop para ocupar mejor el espacio */}
      <div className="w-full max-w-6xl lg:max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 xl:gap-24 items-center relative z-10">
        
        {/* ========================================== */}
        {/* COLUMNA IZQUIERDA: INFORMACIÓN Y PROPUESTA */}
        {/* ========================================== */}
        <motion.div 
          // Animación suave de entrada lateral
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lg:col-span-7 flex flex-col justify-center text-left"
        >
          {/* Logo y Nombre del sistema integrado en la columna izquierda con mayor tamaño */}
          <div className="flex items-center gap-3.5 mb-8">
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md"
              style={{ background: 'var(--color-accent)' }}
            >
              <Sparkles size={22} color="white" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              FocusFlow
            </span>
          </div>

          {/* Titular principal rediseñado: tipografía extrabold ampliada en desktop */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-black tracking-tight leading-[1.05] mb-6 text-[var(--color-text-primary)]">
            Superá la parálisis por análisis.
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent)] to-[#a78bfa]">
              Lográ tus metas, paso a paso.
            </span>
          </h1>

          {/* Subtítulo informativo ajustado con más espacio de aire y tamaño de texto mejorado */}
          <p className="text-sm sm:text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed mb-10 max-w-2xl">
            Un GPS cognitivo diseñado para mentes neurodivergentes (TDAH) y cualquier persona propensa a abrumarse. Descomponemos objetivos complejos en micro-acciones de 5 minutos, reduciendo la ansiedad y eliminando bloqueos de raíz.
          </p>

          {/* Grid de Características: Estructura 2x2 con mayor tamaño y padding en desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
            
            {/* Tarjeta 1: Descomposición inteligente */}
            <div className="flex gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: 'var(--color-accent-light)' }}
              >
                <Zap size={18} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1">
                  Descomposición IA
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-snug">
                  Dividí objetivos complejos en micro-acciones secuenciales y sencillas.
                </p>
              </div>
            </div>

            {/* Tarjeta 2: Modo de enfoque */}
            <div className="flex gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: 'rgba(59,130,246,0.1)' }}
              >
                <Clock size={18} className="text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1">
                  Modo Enfoque
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-snug">
                  Visualizá una sola tarea a la vez para evitar la dispersión y la ansiedad.
                </p>
              </div>
            </div>

            {/* Tarjeta 3: Coach cognitivo TCC */}
            <div className="flex gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: 'rgba(16,185,129,0.1)' }}
              >
                <Brain size={18} className="text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1">
                  Coach Cognitivo
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-snug">
                  Obtené estrategias y apoyo de TCC al instante si te encontrás bloqueado.
                </p>
              </div>
            </div>

            {/* Tarjeta 4: Gamificación sin culpa */}
            <div className="flex gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: 'rgba(245,158,11,0.1)' }}
              >
                <Trophy size={18} className="text-yellow-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1">
                  Gamificación Amigable
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-snug">
                  Ganá XP y completá logros a tu propio ritmo sin presiones ni penalizaciones.
                </p>
              </div>
            </div>

          </div>
        </motion.div>

        {/* ========================================== */}
        {/* COLUMNA DERECHA: TARJETA DE AUTENTICACIÓN   */}
        {/* ========================================== */}
        <motion.div 
          // Animación suave de entrada lateral
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="lg:col-span-5 flex justify-center items-center w-full"
        >
          {/* Contenedor de ancho controlado para el formulario de autenticación: sin bordes ni fondos propios para evitar la duplicación de cajas */}
          <div className="w-full max-w-[390px] sm:max-w-[420px] relative z-10">
            {/* Renderizar AuthPage directamente. Al estar en modo embed=true, se auto-estilizará con sombra y bordes correctos */}
            <AuthPage embed={true} />
          </div>
        </motion.div>

      </div>
    </div>
  )
}

export default LandingPage
