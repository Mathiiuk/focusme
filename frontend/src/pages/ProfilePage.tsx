import React, { useEffect, useState } from 'react'
import { profileService } from '@/services/api'
import type { ProfileData } from '@/services/api'
import { UserProgress } from '@/components/features/dashboard/UserProgress'
import { AchievementBadge } from '@/components/features/profile/AchievementBadge'
import { Trophy, Target, Footprints, Calendar, Edit3, Check, X } from 'lucide-react'

// -------------------------------------------------------
// Definición de todos los logros posibles para mostrar locked/unlocked
// Debe coincidir con achievements.service.ts del backend
// -------------------------------------------------------
const ALL_ACHIEVEMENTS = [
  { type: 'primer_paso',       name: 'Primer Paso',          emoji: '🌟', description: 'Completaste tu primera micro-acción.' },
  { type: 'objetivo_completo', name: 'Misión Cumplida',      emoji: '🏆', description: 'Completaste tu primer objetivo completo.' },
  { type: 'racha_3',           name: 'Tres Seguidos',        emoji: '🔥', description: '3 días consecutivos usando FocusFlow.' },
  { type: 'racha_7',           name: 'Semana Invicta',       emoji: '⚡', description: '7 días consecutivos.' },
  { type: 'racha_30',          name: 'Mes de Constancia',    emoji: '💎', description: '30 días seguidos.' },
  { type: 'energia_constante', name: 'Autoconciencia',       emoji: '🧠', description: 'Registraste energía 7 días seguidos.' },
  { type: 'diez_subtareas',    name: 'Diez Pequeños Pasos',  emoji: '👣', description: '10 micro-acciones completadas.' },
  { type: 'cincuenta_subtareas', name: 'Medio Centenar',     emoji: '🎯', description: '50 micro-acciones completadas.' },
  { type: 'usa_coach',         name: 'Pidió Refuerzos',      emoji: '🤝', description: 'Usaste el coach cognitivo.' },
  { type: 'supero_bloqueo',    name: 'Desbloqueado',         emoji: '🔓', description: 'Resolviste un bloqueo sin abandonar.' },
]

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)

  // Cargar perfil al montar
  useEffect(() => {
    profileService.getProfile()
      .then(data => {
        setProfile(data)
        setNameInput(data.name ?? '')
      })
      .catch(err => console.error('Error al cargar perfil:', err))
      .finally(() => setLoading(false))
  }, [])

  // Guardar nombre editado
  const handleSaveName = async () => {
    if (!nameInput.trim()) return
    setSaving(true)
    try {
      await profileService.updateProfile({ name: nameInput.trim() })
      setProfile(prev => prev ? { ...prev, name: nameInput.trim() } : null)
      setEditingName(false)
    } catch (err) {
      console.error('Error al guardar nombre:', err)
    } finally {
      setSaving(false)
    }
  }

  // Construir lista de logros con estado locked/unlocked
  const achievementsWithStatus = ALL_ACHIEVEMENTS.map(a => {
    const earned = profile?.achievements?.find(e => e.type === a.type)
    return {
      ...a,
      unlocked: !!earned,
      earnedAt: earned?.earnedAt ?? null,
    }
  })

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)]">Cargando tu perfil...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)]">No se pudo cargar el perfil.</p>
      </div>
    )
  }

  const unlockedCount = achievementsWithStatus.filter(a => a.unlocked).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header del perfil */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar placeholder con la inicial */}
          <div className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {(profile.name ?? profile.email)[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {/* Nombre editable */}
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="text-lg font-bold bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-lg px-3 py-1 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] min-w-0 flex-1"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  aria-label="Editar nombre"
                />
                <button onClick={handleSaveName} disabled={saving} className="p-2 rounded-lg hover:bg-[var(--color-success-light)] text-[var(--color-success)] min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Guardar nombre">
                  <Check size={18} />
                </button>
                <button onClick={() => { setEditingName(false); setNameInput(profile.name ?? '') }} className="p-2 rounded-lg hover:bg-[var(--color-error-light)] text-[var(--color-error)] min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Cancelar edición">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[var(--color-text-primary)] truncate">
                  {profile.name ?? 'Sin nombre'}
                </h1>
                <button onClick={() => setEditingName(true)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-muted)] text-[var(--color-text-disabled)] min-w-[36px] min-h-[36px] flex items-center justify-center" aria-label="Editar nombre">
                  <Edit3 size={14} />
                </button>
              </div>
            )}
            <p className="text-sm text-[var(--color-text-secondary)] truncate">{profile.email}</p>
          </div>
        </div>

        {/* Barra de progreso de XP */}
        <UserProgress level={profile.level} xp={profile.xp} streakDays={profile.streakDays} />
      </div>

      {/* Estadísticas resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Target size={20} />
          </div>
          <p className="text-2xl font-black text-[var(--color-text-primary)]">{profile.goalsCompleted}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Objetivos</p>
        </div>
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <div className="bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Footprints size={20} />
          </div>
          <p className="text-2xl font-black text-[var(--color-text-primary)]">{profile.subtasksCompleted}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Pasos</p>
        </div>
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Trophy size={20} />
          </div>
          <p className="text-2xl font-black text-[var(--color-text-primary)]">{unlockedCount}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Logros</p>
        </div>
      </div>

      {/* Sección de logros */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Logros</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mb-5">
          Cada logro celebra un hito personal. Sin presiones, a tu ritmo.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {achievementsWithStatus.map((achievement, index) => (
            <AchievementBadge
              key={achievement.type}
              name={achievement.name}
              emoji={achievement.emoji}
              description={achievement.description}
              unlocked={achievement.unlocked}
              earnedAt={achievement.earnedAt}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Info de cuenta */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">Información</h2>
        <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
          <Calendar size={16} aria-hidden="true" />
          <span>Miembro desde {new Date(profile.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
