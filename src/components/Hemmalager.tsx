'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wine, Plus, Minus, Trash2, Package, Loader2 } from 'lucide-react';
import type { CellarItem } from '@/lib/types';

interface HemmalagerProps {
    onAddFromSearch: () => void;
}

export function Hemmalager({ onAddFromSearch }: HemmalagerProps) {
    const [cellar, setCellar] = useState<CellarItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

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

    const updateQuantity = async (item: CellarItem, delta: number) => {
        const newQuantity = item.quantity + delta;

        if (newQuantity <= 0) {
            // Remove item
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
            {/* Header with add button */}
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
                <button
                    onClick={onAddFromSearch}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wine-red/30 text-wine-red-light text-sm hover:bg-wine-red/40 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Lägg till</span>
                </button>
            </div>

            {cellar.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                    <Wine className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">Tomt hemmalager</h3>
                    <p className="text-white/60 text-sm mb-4">
                        Lägg till viner du har hemma för att hålla koll på ditt lager.
                    </p>
                    <button
                        onClick={onAddFromSearch}
                        className="px-4 py-2 rounded-lg bg-wine-red hover:bg-wine-red-light text-white transition-colors"
                    >
                        Lägg till första vinet
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
