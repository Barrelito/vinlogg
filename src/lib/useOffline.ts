'use client';

import { useState, useEffect, useCallback } from 'react';

export function useOffline() {
    const [isOnline, setIsOnline] = useState(true);
    const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

    useEffect(() => {
        // Check initial online status
        setIsOnline(navigator.onLine);

        // Listen for online/offline events
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration.scope);
                    setIsServiceWorkerReady(true);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New version available
                                    console.log('New version available, refresh to update');
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Function to manually sync data when coming back online
    const syncData = useCallback(async () => {
        if (!isOnline) return;

        // Trigger a refresh of cached data
        try {
            await fetch('/api/logs', { cache: 'no-cache' });
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }, [isOnline]);

    return {
        isOnline,
        isServiceWorkerReady,
        syncData,
    };
}
