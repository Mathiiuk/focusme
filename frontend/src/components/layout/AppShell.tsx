import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { Home, BarChart2, User, Clock, LogOut, Zap, Flame } from 'lucide-react'
import { Icon } from '@/components/ui/Icon'
import { motion } from 'framer-motion'

// -------------------------------------------------------
// Enlaces de navegación principales para la app
// Cada uno tiene su ruta, etiqueta e icono de Lucide
// -------------------------------------------------------
const NAV_LINKS = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/timeline', label: 'Objetivos', icon: Clock },
  { to: '/progress', label: 'Progreso', icon: BarChart2 },
  { to: '/profile', label: 'Perfil', icon: User },
]

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Obtenemos los datos del usuario y la función de logout del store de Zustand
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  // Manejar el cierre de sesión limpiando el store y redirigiendo a la pantalla de login/registro
  const handleLogout = () => {
    clearAuth()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-primary)]">
      {/* -------------------------------------------------------
          Desktop Sidebar (Barra lateral para pantallas medianas y grandes)
          ------------------------------------------------------- */}
      <aside className="hidden md:flex flex-col w-[260px] sidebar fixed h-screen border-r border-[var(--color-border)] shadow-sm bg-[var(--color-bg-muted)]">
        {/* Contenedor del logotipo de la aplicación */}
        <div className="p-6">
          <NavLink
            to="/"
            className="flex items-center gap-3 group text-[var(--color-text-primary)] hover:opacity-90 transition-opacity"
            aria-label="Ir al inicio"
          >
            {/* Icono de rayo estilizado y animado de forma sutil en hover */}
            <div className="p-2 rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)] group-hover:scale-105 transition-transform duration-200">
              <Icon icon={Zap} size="lg" className="fill-current" />
            </div>
            {/* Nombre de la marca con gradiente moderno de alta fidelidad visual */}
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-[var(--color-accent)] to-[#a8a2ff] bg-clip-text text-transparent">
              FocusFlow
            </span>
          </NavLink>
        </div>

        {/* Listado de navegación principal */}
        <nav className="flex-1 px-4 space-y-1.5 mt-4" aria-label="Navegación principal">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] overflow-hidden select-none ${
                  isActive
                    ? 'text-[var(--color-accent)] font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(99,88,255,0.03)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Fondo activo con transición deslizante super suave usando Framer Motion (efecto pill) */}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-bg"
                      className="absolute inset-0 bg-[var(--color-accent-light)] rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    />
                  )}
                  {/* Indicador vertical fino en el extremo izquierdo para dar jerarquía visual */}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute left-0 top-3 bottom-3 w-1 bg-[var(--color-accent)] rounded-r-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    />
                  )}
                  {/* Icono de la sección */}
                  <Icon icon={icon} size="lg" />
                  {/* Texto de la sección */}
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Tarjeta de perfil y gamificación para motivar al usuario (Gamification Center) */}
        {user && (
          <div className="mx-4 p-3 mb-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm flex items-center gap-3 transition-all duration-200">
            {/* Avatar estilizado con gradiente vibrante y la inicial del nombre */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--color-accent)] to-[#a8a2ff] text-white flex items-center justify-center font-bold text-sm shadow-inner flex-shrink-0">
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            
            {/* Información del usuario: nombre, nivel y racha diaria */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {user.name || user.email.split('@')[0]}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {/* Badge con el nivel del usuario */}
                <span className="px-1.5 py-0.5 bg-[var(--color-accent-light)] text-[var(--color-accent)] rounded text-[10px] font-extrabold uppercase tracking-wide">
                  Nv. {user.level || 1}
                </span>
                
                {/* Racha diaria (streak) con animación sutil si tiene días acumulados */}
                {user.streakDays > 0 && (
                  <span 
                    className="text-[var(--color-warning)] font-bold text-xs flex items-center gap-0.5" 
                    title={`${user.streakDays} días consecutivos en FocusFlow`}
                  >
                    <Icon icon={Flame} size="sm" className="fill-current animate-pulse text-[var(--color-warning)]" />
                    <span>{user.streakDays}d</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pie del Sidebar con botón de cerrar sesión */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-light)] transition-all duration-200 min-h-[44px]"
            aria-label="Cerrar sesión"
          >
            <Icon icon={LogOut} size="lg" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------------
          Main Content (Contenedor del contenido principal)
          ------------------------------------------------------- */}
      <main id="main-content" className="flex-1 md:ml-[260px] w-full min-h-screen">
        <div className="w-full max-w-[720px] mx-auto pb-[calc(64px+env(safe-area-inset-bottom)+24px)] md:pb-12 pt-6 md:pt-12 px-4 md:px-8">
          {children}
        </div>
      </main>

      {/* -------------------------------------------------------
          Mobile Bottom Bar (Barra de navegación inferior para móviles)
          ------------------------------------------------------- */}
      <nav className="md:hidden bottom-bar flex items-center justify-around px-2" aria-label="Navegación rápida">
        {NAV_LINKS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] touch-target rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)]'
              }`
            }
            aria-label={label}
          >
            <Icon icon={icon} size="lg" />
            <span className="leading-none mt-0.5">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default AppShell
