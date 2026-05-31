import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/Button'
import { Download, X } from 'lucide-react'

export const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      // Opcional: Console log para debugear
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  // Solo mostrar si hay una actualización o si está listo para funcionar offline
  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-4 rounded-xl shadow-lg flex items-center gap-4 max-w-sm">
        <div className="flex-1">
          {offlineReady ? (
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              App lista para funcionar sin conexión
            </span>
          ) : (
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              Hay una nueva versión disponible
            </span>
          )}
        </div>
        
        {needRefresh && (
          <Button 
            size="sm" 
            variant="primary" 
            onClick={() => updateServiceWorker(true)}
            leftIcon={<Download size={16} />}
          >
            Actualizar
          </Button>
        )}
        
        <button 
          onClick={close} 
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
