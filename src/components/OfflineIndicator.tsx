'use client';

import { WifiOff, Wifi } from 'lucide-react';
import { useOffline } from '@/lib/useOffline';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
    const { isOnline } = useOffline();
    const [showBanner, setShowBanner] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        if (!isOnline) {
            setShowBanner(true);
            setWasOffline(true);
        } else if (wasOffline) {
            // Show "back online" message briefly
            setShowBanner(true);
            const timer = setTimeout(() => {
                setShowBanner(false);
                setWasOffline(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, wasOffline]);

    if (!showBanner) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium transition-all ${isOnline
                    ? 'bg-green-500/90 text-white'
                    : 'bg-orange-500/90 text-white'
                }`}
        >
            <div className="flex items-center justify-center gap-2">
                {isOnline ? (
                    <>
                        <Wifi className="w-4 h-4" />
                        <span>Tillbaka online!</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-4 h-4" />
                        <span>Du är offline - visar cachad data</span>
                    </>
                )}
            </div>
        </div>
    );
}
