'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Actively unregister all existing service workers on user devices
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then(() => {
            console.log('Stale service worker unregistered');
          });
        }
      }).catch((err) => {
        console.warn('Error unregistering service workers:', err);
      });
    }

    // Actively purge all browser CacheStorage entries
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      }).catch((err) => {
        console.warn('Error purging cache storage:', err);
      });
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
