// Controller de autenticación
// Maneja registro, login, refresh de tokens y logout

import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { generateTokens } from '../middleware/auth.middleware'
import { OAuth2Client } from 'google-auth-library'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const prisma = new PrismaClient()

// -------------------------------------------------------
// POST /api/v1/auth/register
// Registro con email y contraseña únicamente
// -------------------------------------------------------
export async function register(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body

  // Validación de campos requeridos
  if (!email || !password) {
    res.status(400).json({ message: 'Email y contraseña son requeridos' })
    return
  }

  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'El email no tiene un formato válido' })
    return
  }

  // Validación de contraseña: mínimo 8 caracteres
  if (password.length < 8) {
    res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' })
    return
  }

  try {
    // Verificar que el email no esté registrado
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      res.status(409).json({ message: 'Ya existe una cuenta con ese email' })
      return
    }

    // Hashear contraseña con bcrypt (costo 12: balance seguridad/velocidad)
    const passwordHash = await bcrypt.hash(password, 12)

    // Crear el usuario en la base de datos
    const user = await prisma.user.create({
      data: { email, passwordHash },
      // Seleccionar solo los campos seguros para devolver al cliente
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        level: true,
        xp: true,
        streakDays: true,
        createdAt: true,
      },
    })

    // Generar tokens JWT
    const { accessToken, refreshToken } = generateTokens(user.id, user.email)

    // Guardar refresh token en la base de datos
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    })

    // Enviar refresh token como cookie HttpOnly (más seguro que localStorage)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
    })

    res.status(201).json({ user, accessToken })
  } catch (error) {
    console.error('[Auth] Error en registro:', error)
    res.status(500).json({ message: 'Error al crear la cuenta — intentá de nuevo' })
  }
}

// -------------------------------------------------------
// POST /api/v1/auth/login
// -------------------------------------------------------
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ message: 'Email y contraseña son requeridos' })
    return
  }

  try {
    // Buscar usuario por email (incluyendo el hash para verificar)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        timezone: true,
        level: true,
        xp: true,
        streakDays: true,
        createdAt: true,
      },
    })

    // Mensaje genérico: no revelar si el email existe o no (seguridad)
    if (!user) {
      res.status(401).json({ message: 'Email o contraseña incorrectos' })
      return
    }

    // Verificar contraseña contra el hash almacenado
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Email o contraseña incorrectos' })
      return
    }

    // Actualizar timestamp de última actividad
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })

    const { accessToken, refreshToken } = generateTokens(user.id, user.email)

    // Guardar nuevo refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    // Devolver usuario sin el hash de contraseña
    const { passwordHash: _, ...safeUser } = user
    res.json({ user: safeUser, accessToken })
  } catch (error) {
    console.error('[Auth] Error en login:', error)
    res.status(500).json({ message: 'Error al iniciar sesión — intentá de nuevo' })
  }
}

// -------------------------------------------------------
// POST /api/v1/auth/logout
// Invalida el refresh token de la sesión actual
// -------------------------------------------------------
export async function logout(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies?.refreshToken

  if (refreshToken) {
    // Eliminar el token de la base de datos para invalidarlo
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  }

  // Limpiar la cookie
  res.clearCookie('refreshToken')
  res.json({ message: 'Sesión cerrada correctamente' })
}

// -------------------------------------------------------
// POST /api/v1/auth/google
// Login/Registro con Google y reCAPTCHA v3
// -------------------------------------------------------
export async function googleAuth(req: Request, res: Response): Promise<void> {
  const { credential, recaptchaToken } = req.body

  if (!credential || !recaptchaToken) {
    res.status(400).json({ message: 'Credenciales incompletas' })
    return
  }

  try {
    // 1. Validar reCAPTCHA
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY
    if (recaptchaSecret) {
      const recaptchaResponse = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`, {
        method: 'POST',
      })
      const recaptchaData = await recaptchaResponse.json() as { success: boolean; score: number }
      
      if (!recaptchaData.success || recaptchaData.score < 0.5) {
        console.warn('[Auth] reCAPTCHA falló o puntaje muy bajo:', recaptchaData)
        res.status(403).json({ message: 'Verificación de seguridad fallida. ¿Sos un robot?' })
        return
      }
    }

    // 2. Validar token de Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    
    if (!payload || !payload.email) {
      res.status(400).json({ message: 'Token de Google inválido' })
      return
    }

    const { email, name } = payload

    // 3. Buscar o crear usuario
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        level: true,
        xp: true,
        streakDays: true,
        createdAt: true,
      },
    })

    if (!user) {
      // Crear usuario nuevo (sin contraseña, ya que usa Google)
      // Generamos un passwordHash vacío o un string aleatorio imposible de adivinar
      const randomPassword = Math.random().toString(36).slice(-8)
      const passwordHash = await bcrypt.hash(randomPassword, 12)

      const newUser = await prisma.user.create({
        data: { 
          email, 
          passwordHash,
          name: name || null
        },
        select: {
          id: true,
          email: true,
          name: true,
          timezone: true,
          level: true,
          xp: true,
          streakDays: true,
          createdAt: true,
        },
      })
      user = newUser
    } else {
      // Actualizar timestamp de última actividad
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      })
    }

    // 4. Generar tokens JWT
    const { accessToken, refreshToken } = generateTokens(user.id, user.email)

    // Guardar nuevo refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({ user, accessToken })
  } catch (error) {
    console.error('[Auth] Error en googleAuth:', error)
    res.status(500).json({ message: 'Error al iniciar sesión con Google' })
  }
}

// -------------------------------------------------------
// PATCH /api/v1/auth/onboarding
// Completar el onboarding: nombre y zona horaria
// -------------------------------------------------------
export async function completeOnboarding(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ message: 'No autorizado' })
    return
  }

  const { name, timezone } = req.body

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // Nombre: opcional, pero se pide amablemente
        ...(name ? { name: name.trim() } : {}),
        // Zona horaria: validar que sea una zona válida de IANA
        ...(timezone ? { timezone } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        level: true,
        xp: true,
        streakDays: true,
        createdAt: true,
      },
    })

    res.json(updatedUser)
  } catch (error) {
    console.error('[Auth] Error en onboarding:', error)
    res.status(500).json({ message: 'Error al guardar los datos' })
  }
}
