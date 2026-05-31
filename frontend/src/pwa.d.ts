// src/pwa.d.ts
// Declaración de tipos global para el módulo virtual de Vite PWA Plugin
// Esto permite que TypeScript reconozca el import virtual de React PWA

declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react'

  // Opciones de configuración para el registro del Service Worker
  export interface RegisterSWOptions {
    immediate?: boolean // registro inmediato
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void // callback al registrar exitosamente
    onRegisterError?: (error: any) => void // callback en caso de error en el registro
    onNeedRefresh?: () => void // callback cuando se requiere refrescar la página
    onOfflineReady?: () => void // callback cuando la app está lista para funcionar offline
  }

  // Estructura del hook useRegisterSW devuelto por el plugin de Vite PWA
  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>]
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}
