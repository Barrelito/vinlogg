'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Wine, Plus, Minus, Trash2, Package, Loader2, Camera, X, Check } from 'lucide-react';
import type { CellarItem } from '@/lib/types';

interface HemmalagerProps {
    onAddFromSearch: () => void;
}

export function Hemmalager({ onAddFromSearch }: HemmalagerProps) {
    const [cellar, setCellar] = useState<CellarItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Quick scan state
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState<'idle' | 'capturing' | 'analyzing' | 'success' | 'error'>('idle');
    const [scanMessage, setScanMessage] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const fetchCellar = useCallback(async () => {
        try {
            const response = await fetch('/api/cellar');
            const data = await response.json();
            if (data.cellar) {
                setCellar(data.cellar);
            }
        } catch (error) {
            console.error('Error fetching cellar:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCellar();
    }, [fetchCellar]);

    // Start camera for quick scan
    const startQuickScan = async () => {
        setIsScanning(true);
        setScanStatus('idle');
        setScanMessage('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Camera error:', error);
            setScanStatus('error');
            setScanMessage('Kunde inte starta kameran');
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsScanning(false);
        setScanStatus('idle');
    };

    // Capture and scan
    const captureAndScan = async () => {
        if (!videoRef.current) return;

        setScanStatus('capturing');
        setScanMessage('Tar bild...');

        // Capture frame
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoRef.current, 0, 0);
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

        setScanStatus('analyzing');
        setScanMessage('Analyserar vin...');

        try {
            // Send to scan API
            const response = await fetch('/api/scan-wine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageBase64 })
            });

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            // Add to cellar
            const wineId = result.wine?.id;
            if (wineId) {
                await fetch('/api/cellar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wine_id: wineId, quantity: 1 })
                });

                setScanStatus('success');
                setScanMessage(`${result.wine?.name || 'Vin'} tillagt!`);

                // Refresh cellar list
                fetchCellar();

                // Auto-close after success
                setTimeout(() => {
                    stopCamera();
                }, 1500);
            } else {
                throw new Error('Kunde inte identifiera vinet');
            }
        } catch (error) {
            console.error('Scan error:', error);
            setScanStatus('error');
            setScanMessage(error instanceof Error ? error.message : 'Något gick fel');
        }
    };

    const updateQuantity = async (item: CellarItem, delta: number) => {
        const newQuantity = item.quantity + delta;

        if (newQuantity <= 0) {
            await removeItem(item.id);
            return;
        }

        setUpdatingId(item.id);
        try {
            const response = await fetch('/api/cellar', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, quantity: newQuantity })
            });

            if (response.ok) {
                setCellar(prev => prev.map(c =>
                    c.id === item.id ? { ...c, quantity: newQuantity } : c
                ));
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const removeItem = async (id: string) => {
        setUpdatingId(id);
        try {
            const response = await fetch(`/api/cellar?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setCellar(prev => prev.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error('Error removing item:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-wine-red animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Quick scan modal */}
            {isScanning && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col">
                    {/* Camera view */}
                    <div className="flex-1 relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay with status */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {scanStatus === 'analyzing' && (
                                <div className="bg-black/70 px-6 py-4 rounded-2xl flex flex-col items-center gap-3">
                                    <Loader2 className="w-10 h-10 text-wine-red animate-spin" />
                                    <span className="text-white text-sm">{scanMessage}</span>
                                </div>
                            )}
                            {scanStatus === 'success' && (
                                <div className="bg-green-500/90 px-6 py-4 rounded-2xl flex flex-col items-center gap-3">
                                    <Check className="w-10 h-10 text-white" />
                                    <span className="text-white text-sm font-medium">{scanMessage}</span>
                                </div>
                            )}
                            {scanStatus === 'error' && (
                                <div className="bg-red-500/90 px-6 py-4 rounded-2xl flex flex-col items-center gap-3">
                                    <X className="w-10 h-10 text-white" />
                                    <span className="text-white text-sm">{scanMessage}</span>
                                </div>
                            )}
                        </div>

                        {/* Close button */}
                        <button
                            onClick={stopCamera}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    {/* Capture button */}
                    <div className="p-6 bg-black flex justify-center">
                        <button
                            onClick={captureAndScan}
                            disabled={scanStatus === 'analyzing' || scanStatus === 'success'}
                            className="w-20 h-20 rounded-full bg-wine-red flex items-center justify-center disabled:opacity-50"
                        >
                            <Camera className="w-10 h-10 text-white" />
                        </button>
                    </div>

                    {/* Label */}
                    <div className="pb-8 text-center">
                        <p className="text-white/70 text-sm">Snabbscan - läggs direkt i hemmalager</p>
                    </div>
                </div>
            )}

            {/* Header with add buttons */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-wine-red-light" />
                    <h2 className="text-lg font-semibold text-white">Hemmalager</h2>
                    {cellar.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-wine-red/30 text-xs text-wine-red-light">
                            {cellar.reduce((sum, c) => sum + c.quantity, 0)} flaskor
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={startQuickScan}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wine-red text-white text-sm hover:bg-wine-red-light transition-colors"
                    >
                        <Camera className="w-4 h-4" />
                        <span className="hidden sm:inline">Snabbscan</span>
                    </button>
                    <button
                        onClick={onAddFromSearch}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {cellar.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                    <Wine className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">Tomt hemmalager</h3>
                    <p className="text-white/60 text-sm mb-4">
                        Scanna viner för att hålla koll på ditt lager.
                    </p>
                    <button
                        onClick={startQuickScan}
                        className="px-4 py-2 rounded-lg bg-wine-red hover:bg-wine-red-light text-white transition-colors flex items-center gap-2 mx-auto"
                    >
                        <Camera className="w-4 h-4" />
                        Scanna första vinet
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {cellar.map(item => (
                        <div
                            key={item.id}
                            className="glass-card rounded-xl p-4 flex items-center gap-4"
                        >
                            {/* Wine icon */}
                            <div className="w-12 h-12 rounded-lg bg-wine-red/20 flex items-center justify-center flex-shrink-0">
                                <Wine className="w-6 h-6 text-wine-red-light" />
                            </div>

                            {/* Wine info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-white truncate">
                                    {item.wine?.name || 'Okänt vin'}
                                </h3>
                                <p className="text-sm text-white/60 truncate">
                                    {item.wine?.producer || item.wine?.region || ''}
                                </p>
                            </div>

                            {/* Quantity controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateQuantity(item, -1)}
                                    disabled={updatingId === item.id}
                                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 disabled:opacity-50 transition-colors"
                                >
                                    <Minus className="w-4 h-4 text-white" />
                                </button>

                                <span className="w-8 text-center font-medium text-white">
                                    {item.quantity}
                                </span>

                                <button
                                    onClick={() => updateQuantity(item, 1)}
                                    disabled={updatingId === item.id}
                                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 disabled:opacity-50 transition-colors"
                                >
                                    <Plus className="w-4 h-4 text-white" />
                                </button>
                            </div>

                            {/* Delete button */}
                            <button
                                onClick={() => removeItem(item.id)}
                                disabled={updatingId === item.id}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

