import React, { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores'
import { authService } from '@/services/api'
import { Sparkles, ArrowRight } from 'lucide-react'

// -------------------------------------------------------
// Tipos de vistas dentro de AuthPage
// -------------------------------------------------------
type AuthView = 'login' | 'register' | 'onboarding'

// -------------------------------------------------------
// Zonas horarias para el onboarding
// -------------------------------------------------------
const TIMEZONES = [
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (UTC-3)' },
  { value: 'America/Santiago', label: 'Chile (UTC-4/-3)' },
  { value: 'America/Bogota', label: 'Colombia (UTC-5)' },
  { value: 'America/Lima', label: 'Perú (UTC-5)' },
  { value: 'America/Mexico_City', label: 'México (UTC-6)' },
  { value: 'America/New_York', label: 'Este de EE.UU. (UTC-5/-4)' },
  { value: 'Europe/Madrid', label: 'España (UTC+1/+2)' },
  { value: 'UTC', label: 'UTC' },
]

// -------------------------------------------------------
// Página de autenticación
// Tres vistas: login → register → onboarding
// El onboarding solo pregunta nombre y zona horaria
// -------------------------------------------------------
const AuthPage: React.FC = () => {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const { setAuth, updateUser } = useAuthStore()

  // Vista actual
  const [view, setView] = useState<AuthView>('login')

  // Campos del formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('America/Argentina/Buenos_Aires')

  // Estado de carga y errores
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // -------------------------------------------------------
  // Manejar login
  // -------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const { user, accessToken } = await authService.login({ email, password })
      setAuth(user, accessToken)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.message ?? 'No pudimos iniciar sesión. Verificá tus datos.')
    } finally {
      setIsLoading(false)
    }
  }

  // -------------------------------------------------------
  // Manejar registro
  // -------------------------------------------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const { user, accessToken } = await authService.register({ email, password })
      setAuth(user, accessToken)
      // Pasar al onboarding post-registro
      setView('onboarding')
    } catch (err: any) {
      setError(err.message ?? 'No pudimos crear la cuenta. Intentá de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  // -------------------------------------------------------
  // Manejar onboarding (nombre + zona horaria)
  // -------------------------------------------------------
  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const updatedUser = await authService.completeOnboarding({ name, timezone })
      updateUser(updatedUser)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.message ?? 'Algo salió mal. Intentá de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main
      id="auth-main"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo y nombre */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'var(--color-accent)' }}
            aria-hidden="true"
          >
            <Sparkles size={22} color="white" />
          </div>
          <h1 className="text-[26px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
            FocusFlow
          </h1>
          <p className="text-[15px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Tu GPS cognitivo personal
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* ---- Vista: Login ---- */}
          {view === 'login' && (
            <motion.div
              key="login"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="surface p-6">
                <h2 className="text-[18px] font-semibold mb-5" style={{ color: 'var(--color-text-primary)' }}>
                  Bienvenido de vuelta
                </h2>

                <form onSubmit={handleLogin} noValidate className="space-y-4">
                  <Input
                    id="login-email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                  />
                  <Input
                    id="login-password"
                    label="Contraseña"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />

                  {/* Error de autenticación */}
                  {error && (
                    <p role="alert" className="text-[14px]" style={{ color: 'var(--color-error)' }}>
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight size={16} aria-hidden="true" />}
                    className="w-full"
                  >
                    Entrar
                  </Button>
                </form>
              </div>

              <p className="text-center text-[14px] mt-4" style={{ color: 'var(--color-text-secondary)' }}>
                ¿Primera vez?{' '}
                <button
                  id="go-to-register-btn"
                  onClick={() => { setView('register'); setError(null) }}
                  className="font-medium underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-focus-ring)] rounded"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Crear cuenta
                </button>
              </p>
            </motion.div>
          )}

          {/* ---- Vista: Registro ---- */}
          {view === 'register' && (
            <motion.div
              key="register"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="surface p-6">
                <h2 className="text-[18px] font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Crear cuenta
                </h2>
                <p className="text-[14px] mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                  Solo necesitamos tu email y una contraseña. Sin datos extra.
                </p>

                <form onSubmit={handleRegister} noValidate className="space-y-4">
                  <Input
                    id="register-email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                  />
                  <Input
                    id="register-password"
                    label="Contraseña"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 8 caracteres"
                    hint="Usá algo que recuerdes fácil."
                  />

                  {error && (
                    <p role="alert" className="text-[14px]" style={{ color: 'var(--color-error)' }}>
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight size={16} aria-hidden="true" />}
                    className="w-full"
                  >
                    Crear cuenta
                  </Button>
                </form>
              </div>

              <p className="text-center text-[14px] mt-4" style={{ color: 'var(--color-text-secondary)' }}>
                ¿Ya tenés cuenta?{' '}
                <button
                  id="go-to-login-btn"
                  onClick={() => { setView('login'); setError(null) }}
                  className="font-medium underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-focus-ring)] rounded"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Iniciar sesión
                </button>
              </p>
            </motion.div>
          )}

          {/* ---- Vista: Onboarding (2 preguntas únicamente) ---- */}
          {view === 'onboarding' && (
            <motion.div
              key="onboarding"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="surface p-6">
                <h2 className="text-[18px] font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Casi listo 🎉
                </h2>
                <p className="text-[14px] mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                  Dos preguntas rápidas y empezamos.
                </p>

                <form onSubmit={handleOnboarding} noValidate className="space-y-4">
                  <Input
                    id="onboarding-name"
                    label="¿Cómo querés que te llame?"
                    type="text"
                    autoComplete="given-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre o apodo"
                    hint="Solo tu nombre, nada más."
                  />

                  {/* Selector de zona horaria */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="onboarding-timezone"
                      className="text-[15px] font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      ¿Dónde estás?
                    </label>
                    <select
                      id="onboarding-timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className={[
                        'w-full rounded-md border px-4 py-3 min-h-[44px]',
                        'text-[16px] transition-colors duration-150',
                        'focus:outline-none focus:ring-[3px] focus:ring-offset-0',
                      ].join(' ')}
                      style={{
                        background: 'var(--color-bg-surface)',
                        color: 'var(--color-text-primary)',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                      Para adaptar horarios y recordatorios.
                    </p>
                  </div>

                  {error && (
                    <p role="alert" className="text-[14px]" style={{ color: 'var(--color-error)' }}>
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight size={16} aria-hidden="true" />}
                    className="w-full"
                  >
                    ¡Empezamos!
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

export default AuthPage
