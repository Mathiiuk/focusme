import React, { useEffect, useState } from 'react'
import { userService } from '@/services/api'
import type { DailyStat } from '@/types'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Activity, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'

export const ProgressPage: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DailyStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userService.getStats()
      .then(data => setStats(data))
      .catch(err => console.error('Error fetching stats:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)]">Cargando tu progreso...</p>
      </div>
    )
  }

  const totalTasks = stats.reduce((acc, curr) => acc + curr.tasks, 0)

  return (
    <main className="min-h-screen bg-[var(--color-bg-primary)] p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} leftIcon={<ArrowLeft size={18} />}>
            Volver
          </Button>
          <h1 className="text-2xl font-bold ml-4 text-[var(--color-text-primary)]">Mi Progreso</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[var(--color-bg-muted)] p-6 rounded-2xl border border-[var(--color-border)] flex flex-col items-center justify-center">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full mb-3">
              <Activity size={28} />
            </div>
            <h2 className="text-3xl font-black text-[var(--color-text-primary)]">{totalTasks}</h2>
            <p className="text-[var(--color-text-secondary)] text-sm">Tareas completadas (7 días)</p>
          </div>
          
          <div className="bg-[var(--color-bg-muted)] p-6 rounded-2xl border border-[var(--color-border)] flex flex-col items-center justify-center">
            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full mb-3">
              <Zap size={28} />
            </div>
            <p className="text-center text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-xs">
              Recuerda que el progreso no es lineal. ¡Cualquier paso adelante es una victoria!
            </p>
          </div>
        </div>

        <div className="bg-[var(--color-bg-muted)] p-6 rounded-2xl border border-[var(--color-border)] mb-6">
          <h3 className="text-lg font-bold mb-6 text-[var(--color-text-primary)]">Acciones por día</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'var(--color-bg-primary)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="tasks" fill="var(--color-accent)" radius={[6, 6, 0, 0]} name="Tareas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--color-bg-muted)] p-6 rounded-2xl border border-[var(--color-border)]">
          <h3 className="text-lg font-bold mb-6 text-[var(--color-text-primary)]">Tu Energía Diaria</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">
            Observa cómo fluctúa tu energía. Es normal tener días bajos, ¡no te exijas de más!
          </p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} dy={10} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} name="Nivel (1-5)" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </main>
  )
}

export default ProgressPage
