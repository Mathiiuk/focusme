import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type ShortcutMap = {
  [key: string]: () => void;
};

export function useShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Evitar atajos si el usuario está escribiendo en un input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        // Excepción: escape siempre debe funcionar
        if (event.key !== 'Escape') {
          return;
        }
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? event.metaKey : event.ctrlKey;

      for (const [shortcut, callback] of Object.entries(shortcuts)) {
        const keys = shortcut.toLowerCase().split('+');
        
        let match = true;
        for (const key of keys) {
          if (key === 'mod') {
            if (!mod) match = false;
          } else if (key === 'shift') {
            if (!event.shiftKey) match = false;
          } else if (key === 'alt') {
            if (!event.altKey) match = false;
          } else {
            if (event.key.toLowerCase() !== key) match = false;
          }
        }

        if (match) {
          event.preventDefault();
          callback();
          return; // Solo ejecutar un atajo
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Hook de aplicación global para navegación
export function useGlobalShortcuts() {
  const navigate = useNavigate();

  useShortcuts({
    'f': () => navigate('/focus'),
    // mod+k y mod+/ se implementarán en los componentes correspondientes (Dashboard/Chat)
  });
}
