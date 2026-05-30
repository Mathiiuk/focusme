# FocusFlow AI

GPS cognitivo personal para personas con TDAH, ansiedad y dificultades para iniciar tareas.

## ¿Qué es?

FocusFlow AI no es un gestor de tareas. Toma objetivos ambiguos y los convierte en micro-acciones de 1-5 minutos mediante IA, con un diseño centrado en la reducción de carga cognitiva.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Estado | Zustand + React Query |
| Animaciones | Framer Motion |
| Backend | Node.js + Express.js + TypeScript |
| Base de datos | PostgreSQL + Prisma ORM |
| IA | OpenAI GPT-4o |
| Auth | JWT (access 15min + refresh 7d en cookies HttpOnly) |
| Deploy | Vercel (frontend) + Render (backend + PostgreSQL) |

## Inicio rápido

### Prerrequisitos
- Node.js 18+
- PostgreSQL local (o acceso a Render PostgreSQL)
- API key de OpenAI (opcional — sin key usa respuestas mock)

### 1. Instalar dependencias

```bash
# Desde la raíz del monorepo
npm install

# Instalar en cada workspace
npm install --workspace=frontend
npm install --workspace=backend
```

### 2. Configurar variables de entorno

```bash
# Backend
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores

# Frontend (en desarrollo el proxy de Vite maneja la URL del backend)
# No necesitás .env.local en desarrollo
```

### 3. Configurar la base de datos

```bash
# Crear la base de datos y correr las migraciones
cd backend
npx prisma migrate dev --name init

# (Opcional) Abrir Prisma Studio para explorar los datos
npx prisma studio
```

### 4. Iniciar en desarrollo

```bash
# Desde la raíz: inicia frontend y backend en paralelo
npm run dev

# O por separado:
npm run dev:frontend   # → http://localhost:5173
npm run dev:backend    # → http://localhost:3001
```

## Estructura del proyecto

```
focusflow-ai/
├── frontend/          ← React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              ← Button, Input, Dialog
│   │   │   └── features/        ← Dashboard, AdhdMode, Auth
│   │   ├── pages/               ← DashboardPage, AdhdModePage, AuthPage
│   │   ├── stores/              ← Zustand (auth, dashboard, adhd)
│   │   ├── services/            ← API client
│   │   ├── hooks/               ← useBlockDetection
│   │   └── types/               ← TypeScript types
│   └── vercel.json
│
└── backend/           ← Express + Prisma
    ├── src/
    │   ├── controllers/         ← auth, goals, blocks
    │   ├── middleware/          ← auth JWT
    │   ├── prompts/             ← sistema de prompts de IA
    │   └── services/            ← openai.service.ts
    └── prisma/
        └── schema.prisma        ← esquema completo de la DB
```

## Principios de diseño

- **Una cosa a la vez**: la pantalla siempre muestra exactamente una acción
- **Sin animaciones que distraigan**: todas respetan `prefers-reduced-motion`
- **Accesibilidad WCAG 2.1 AA**: contraste, focus ring, ARIA, touch targets 44px
- **Lenguaje empático**: nunca "deberías" ni "tenés que"
- **Dark mode automático**: respeta `prefers-color-scheme`

## Roadmap

| Fase | Semanas | Estado |
|------|---------|--------|
| Fase 1 — MVP | 1-6 | ✅ En desarrollo |
| Fase 2 — Beta privada | 7-12 | 🔜 Planificada |
| Fase 3 — Beta pública | 13-18 | 🔜 Planificada |
| Fase 4 — Producción | 19-26 | 🔜 Planificada |
