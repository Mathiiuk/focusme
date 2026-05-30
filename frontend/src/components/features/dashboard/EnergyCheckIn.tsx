import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Battery, BatteryCharging, BatteryFull, BatteryLow, BatteryMedium } from 'lucide-react'

interface EnergyCheckInProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (level: number) => void
  isLoading?: boolean
}

// Representación visual y semántica de los 5 niveles de energía
const ENERGY_LEVELS = [
  { value: 1, label: 'Agotado', icon: Battery, color: 'text-red-500' },
  { value: 2, label: 'Baja', icon: BatteryLow, color: 'text-orange-500' },
  { value: 3, label: 'Normal', icon: BatteryMedium, color: 'text-yellow-500' },
  { value: 4, label: 'Buena', icon: BatteryCharging, color: 'text-green-500' },
  { value: 5, label: 'Excelente', icon: BatteryFull, color: 'text-blue-500' },
]

export const EnergyCheckIn: React.FC<EnergyCheckInProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  const handleSubmit = () => {
    if (selectedLevel) {
      onSubmit(selectedLevel)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="¿Cómo está tu energía hoy?"
      description="Esto nos ayuda a ajustar el tamaño de las tareas para que sean fáciles de hacer."
    >
      <div className="grid grid-cols-5 gap-2 my-6">
        {ENERGY_LEVELS.map(({ value, label, icon: Icon, color }) => (
          <button
            key={value}
            onClick={() => setSelectedLevel(value)}
            disabled={isLoading}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
              selectedLevel === value
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] scale-105'
                : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
            }`}
            aria-pressed={selectedLevel === value}
            aria-label={`Energía ${label}`}
          >
            <Icon size={28} className={color} />
            <span className="text-xs font-medium mt-2">{value}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mt-2">
        <Button
          variant="primary"
          className="flex-1"
          disabled={!selectedLevel || isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? 'Guardando...' : 'Confirmar'}
        </Button>
      </div>
    </Dialog>
  )
}
