// Middleware de autenticación JWT
// Verifica que el token de acceso es válido antes de permitir el acceso a rutas protegidas

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// -------------------------------------------------------
// Extender el tipo Request de Express para incluir el usuario
// Esto permite que los controllers accedan a req.user.id
// -------------------------------------------------------
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
      }
    }
  }
}

// -------------------------------------------------------
// Payload del JWT de acceso
// -------------------------------------------------------
interface JwtPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

// -------------------------------------------------------
// Middleware: verificar JWT en el header Authorization
// -------------------------------------------------------
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Extraer el token del header "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No autorizado — token requerido' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    // Verificar y decodificar el token
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET no configurado')

    const payload = jwt.verify(token, secret) as JwtPayload

    // Añadir datos del usuario al request para uso en controllers
    req.user = {
      id: payload.userId,
      email: payload.email,
    }

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expirado — iniciá sesión de nuevo' })
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Token inválido' })
    } else {
      res.status(500).json({ message: 'Error al verificar autenticación' })
    }
  }
}

// -------------------------------------------------------
// Función auxiliar: generar tokens JWT
// -------------------------------------------------------
export function generateTokens(userId: string, email: string) {
  const secret = process.env.JWT_SECRET!

  // Token de acceso: expira en 15 minutos
  const accessToken = jwt.sign(
    { userId, email },
    secret,
    { expiresIn: '15m' }
  )

  // Token de refresco: expira en 7 días
  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' },
    secret,
    { expiresIn: '7d' }
  )

  return { accessToken, refreshToken }
}
