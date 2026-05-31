// Punto de entrada del servidor Express
// Configura middleware, rutas y manejo de errores

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'

// Importar controllers directamente (en fase 1 sin router separado por claridad)
import { register, login, logout, completeOnboarding, googleAuth } from './controllers/auth.controller'
import {
  createGoal,
  getGoals,
  getGoalById,
  completeGoal,
  completeSubtask,
} from './controllers/goals.controller'
import { createBlock, resolveBlock } from './controllers/blocks.controller'
import { getMe, logEnergy, getStats } from './controllers/users.controller'
import { chatWithCoach } from './controllers/chat.controller'
import { getProfile, updateProfile } from './controllers/profile.controller'
import { authenticate } from './middleware/auth.middleware'

// -------------------------------------------------------
// Inicializar la aplicación Express
// -------------------------------------------------------
const app = express()

// Confiar en el proxy (Vercel/Render) para que express-rate-limit obtenga la IP real mediante X-Forwarded-For
app.set('trust proxy', 1)

// -------------------------------------------------------
// Configuración de CORS
// Solo acepta requests desde la URL del frontend
// -------------------------------------------------------
const allowedOrigins = [
  process.env.CLIENT_URL?.replace(/\/$/, ''), // URL del frontend en producción (eliminamos barra diagonal final si existe)
  'http://localhost:5173',       // Frontend en desarrollo (puerto por defecto)
  'http://127.0.0.1:5173',
  'http://localhost:5174',       // Soportar puerto secundario si el puerto por defecto está en uso por otra tarea
  'http://127.0.0.1:5174',       // Dirección IP loopback alternativa para el puerto secundario
  'http://localhost:5175',       // Puerto terciario preventivo para desarrollo robusto
  'http://127.0.0.1:5175',       // IP loopback para el puerto terciario
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (ej: Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: origen no permitido: ${origin}`))
    }
  },
  credentials: true, // necesario para enviar cookies del refresh token
}))

// -------------------------------------------------------
// Middleware de seguridad
// -------------------------------------------------------
// Helmet: configura headers HTTP de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Se configura en Vercel para el frontend
}))

// Parsear JSON del body de las requests
app.use(express.json({ limit: '10kb' })) // límite para prevenir ataques de payload grande

// Parsear cookies (para el refresh token)
app.use(cookieParser())

// -------------------------------------------------------
// Rate limiting
// Previene abuso y ataques de fuerza bruta
// -------------------------------------------------------

// Límite general: 100 requests por 15 minutos por IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Demasiadas requests — esperá un momento' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Límite estricto para auth: 10 intentos por 15 minutos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Demasiados intentos de login — esperá 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Límite para requests a la IA: 30 por hora (costo de API)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { message: 'Límite de requests a la IA alcanzado — volvé en una hora' },
})

// Aplicar límite general a todas las rutas
app.use('/api/', generalLimiter)

// -------------------------------------------------------
// Health check — Render lo usa para verificar que el servicio está vivo
// -------------------------------------------------------
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

// -------------------------------------------------------
// Rutas de autenticación (simplificadas sin v1)
// -------------------------------------------------------
app.post('/api/auth/register', authLimiter, register)
app.post('/api/auth/login', authLimiter, login)
app.post('/api/auth/google', authLimiter, googleAuth)
app.post('/api/auth/logout', logout)
app.patch('/api/auth/onboarding', authenticate, completeOnboarding)

// -------------------------------------------------------
// Rutas de objetivos y subtareas (simplificadas sin v1) — todas protegidas
// -------------------------------------------------------
app.post('/api/goals', authenticate, aiLimiter, createGoal)
app.get('/api/goals', authenticate, getGoals)
app.get('/api/goals/:id', authenticate, getGoalById)
app.patch('/api/goals/:id/complete', authenticate, completeGoal)
app.patch('/api/subtasks/:id/complete', authenticate, completeSubtask)

// -------------------------------------------------------
// Rutas de bloqueos (simplificadas sin v1) — todas protegidas
// -------------------------------------------------------
app.post('/api/blocks', authenticate, createBlock)
app.patch('/api/blocks/:id/resolve', authenticate, resolveBlock)

// -------------------------------------------------------
// Rutas de Usuarios y Energía (Fase 2 - simplificadas)
// -------------------------------------------------------
app.get('/api/users/me', authenticate, getMe)
app.post('/api/energy', authenticate, logEnergy)
app.get('/api/stats', authenticate, getStats)

// -------------------------------------------------------
// Rutas de Chat Cognitivo (Fase 2 - simplificadas)
// -------------------------------------------------------
app.post('/api/chat', authenticate, chatWithCoach)

// -------------------------------------------------------
// Rutas de Perfil (Fase 3 - simplificadas)
// -------------------------------------------------------
app.get('/api/profile', authenticate, getProfile)
app.patch('/api/profile', authenticate, updateProfile)

// -------------------------------------------------------
// Manejo de rutas no encontradas (404)
// -------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' })
})

// -------------------------------------------------------
// Manejador global de errores
// Captura errores no manejados en los controllers
// -------------------------------------------------------
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Error no manejado:', err.message)

  // No exponer detalles del error en producción
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message

  res.status(500).json({ message })
})

// -------------------------------------------------------
// Iniciar el servidor
// -------------------------------------------------------
const PORT = process.env.PORT ?? 3001

app.listen(PORT, () => {
  console.info(`
╔════════════════════════════════════════╗
║   FocusFlow AI — Backend               ║
║   Puerto: ${PORT}                          ║
║   Entorno: ${process.env.NODE_ENV ?? 'development'}               ║
╚════════════════════════════════════════╝
  `)
})

export default app
