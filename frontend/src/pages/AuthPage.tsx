import React, { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores'
import { authService } from '@/services/api'
import { Sparkles, ArrowRight } from 'lucide-react'
import { GoogleLogin, CredentialResponse, GoogleOAuthProvider } from '@react-oauth/google'
import { useGoogleReCaptcha, GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

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
// Interfaz para definir las propiedades de AuthPageContent
// -------------------------------------------------------
interface AuthPageContentProps {
  embed?: boolean // Propiedad opcional para indicar si el formulario está embebido en otra página (como la Landing Page)
}

// -------------------------------------------------------
// Página de autenticación (Contenido)
// Tres vistas: login → register → onboarding
// El onboarding solo pregunta nombre y zona horaria
// -------------------------------------------------------
const AuthPageContent: React.FC<AuthPageContentProps> = ({ embed = false }) => {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const { setAuth, updateUser } = useAuthStore()

  // Vista actual
  const [view, setView] = useState<AuthView>('login')

  // Campos del formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState(() => {
    // Auto-detectar la zona horaria del navegador para preseleccionar
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    // Usar la detectada si está en nuestra lista, o Argentina como fallback
    const isKnown = TIMEZONES.some(tz => tz.value === detected)
    return isKnown ? detected : 'America/Argentina/Buenos_Aires'
  })

  // Estado de carga y errores
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { executeRecaptcha } = useGoogleReCaptcha()

  // -------------------------------------------------------
  // Manejar login con Google
  // -------------------------------------------------------
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setIsLoading(true)
      setError(null)
      if (!executeRecaptcha) {
        throw new Error('reCAPTCHA no está disponible en este momento')
      }
      const recaptchaToken = await executeRecaptcha('google_login')
      
      const { user, accessToken } = await authService.googleLogin(credentialResponse.credential!, recaptchaToken)
      setAuth(user, accessToken)
      
      // Si el usuario no tiene nombre (es nuevo), pedir onboarding
      if (!user.name) {
        setView('onboarding')
      } else {
        navigate('/', { replace: true })
      }
    } catch (err: any) {
      setError(err.message ?? 'No pudimos iniciar sesión con Google.')
    } finally {
      setIsLoading(false)
    }
  }

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
      // Si está embebido, eliminamos márgenes y padding para que se ajuste perfectamente; si no, ocupa toda la pantalla
      className={`flex flex-col items-center justify-center ${embed ? 'px-0 py-0 w-full' : 'min-h-screen px-4 py-12'}`}
      // Si está embebido, el fondo es transparente para fusionarse con el contenedor de la Landing Page; si no, usa el color de fondo estándar
      style={{ background: embed ? 'transparent' : 'var(--color-bg-primary)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo y nombre: se ocultan si se embebe en la Landing Page para ahorrar espacio vertical */}
        {!embed && (
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
        )}

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
              {/* Si está embebido, agregamos una sombra premium para que actúe como tarjeta única y eliminamos sombras duplicadas */}
              <div className={`surface ${embed ? 'p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md' : 'p-6'}`}>
                <h2 className="text-[18px] font-semibold mb-5" style={{ color: 'var(--color-text-primary)' }}>
                  Bienvenido de vuelta
                </h2>

                <div className="mb-6 flex justify-center">
                  <GoogleLogin 
                    onSuccess={handleGoogleSuccess} 
                    onError={() => setError('Falló el inicio de sesión con Google')} 
                    useOneTap
                  />
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[var(--color-border)]"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[var(--color-bg-surface)] px-2 text-[var(--color-text-secondary)]">O con email</span>
                  </div>
                </div>

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
              {/* Ajustar el padding y sombra en el registro si está embebido para usar sombra premium de tarjeta única */}
              <div className={`surface ${embed ? 'p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md' : 'p-6'}`}>
                <h2 className="text-[18px] font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Crear cuenta
                </h2>
                <p className="text-[14px] mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                  Solo necesitamos tu email y una contraseña. Sin datos extra.
                </p>

                <div className="mb-6 flex justify-center">
                  <GoogleLogin 
                    onSuccess={handleGoogleSuccess} 
                    onError={() => setError('Falló el registro con Google')} 
                  />
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[var(--color-border)]"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[var(--color-bg-surface)] px-2 text-[var(--color-text-secondary)]">O con email</span>
                  </div>
                </div>

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
              {/* Ajustar el padding y sombra en el onboarding si está embebido para usar sombra premium de tarjeta única */}
              <div className={`surface ${embed ? 'p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md' : 'p-6'}`}>
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

// -------------------------------------------------------
// Wrapper de Autenticación
// Solo cargamos Google Auth y reCAPTCHA en esta ruta para optimizar rendimiento
// -------------------------------------------------------
interface AuthPageProps {
  embed?: boolean // Propiedad opcional para soportar el renderizado embebido
}

const AuthPage: React.FC<AuthPageProps> = ({ embed = false }) => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''}>
        <AuthPageContent embed={embed} />
      </GoogleReCaptchaProvider>
    </GoogleOAuthProvider>
  )
}

export default AuthPage
