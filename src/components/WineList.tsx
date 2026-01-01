'use client';

import { useState } from 'react';
import { Wine, Star, MapPin, Calendar, Trash2, Loader2, Users } from 'lucide-react';
import type { WineLog } from '@/lib/types';

interface WineListProps {
    logs: WineLog[];
    onSelect: (log: WineLog) => void;
    onDelete?: (logId: string) => void;
}

export function WineList({ logs, onSelect, onDelete }: WineListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (e: React.MouseEvent, logId: string) => {
        e.stopPropagation(); // Prevent opening the modal

        if (!confirm('Vill du verkligen radera detta vin från din vinkällare?')) {
            return;
        }

        setDeletingId(logId);

        try {
            const response = await fetch(`/api/logs?id=${logId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success && onDelete) {
                onDelete(logId);
            } else {
                alert('Kunde inte radera vinet. Försök igen.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Ett fel uppstod. Försök igen.');
        } finally {
            setDeletingId(null);
        }
    };

    if (logs.length === 0) {
        return (
            <div className="text-center py-12 text-white/40">
                <Wine className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Din vinkällare är tom</p>
                <p className="text-sm mt-2">Skanna en flaska för att börja logga</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {logs.map((log, index) => (
                <div
                    key={log.id}
                    className="glass-card w-full p-4 flex items-center gap-4 transition-all duration-200 slide-up relative group"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    {/* Main clickable area */}
                    <button
                        onClick={() => onSelect(log)}
                        className="flex items-center gap-4 flex-1 text-left hover:opacity-80 transition-opacity"
                    >
                        {/* Wine thumbnail */}
                        <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-wine-red/30 to-wine-red/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {log.user_image_url ? (
                                <img
                                    src={log.user_image_url}
                                    alt={log.wine?.name || 'Vin'}
                                    className="w-full h-full object-cover"
                                />
                            ) : log.wine?.image_url ? (
                                <img
                                    src={log.wine.image_url}
                                    alt={log.wine.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Wine className="w-8 h-8 text-wine-red/60" />
                            )}
                        </div>

                        {/* Wine info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">
                                {log.wine?.name || 'Okänt vin'}
                            </h3>

                            {log.wine?.producer && (
                                <p className="text-sm text-white/60 truncate">
                                    {log.wine.producer}
                                </p>
                            )}

                            <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                                {log.rating && (
                                    <div className="flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                        <span>{log.rating}/5</span>
                                    </div>
                                )}

                                {log.location_name && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[100px]">{log.location_name}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{new Date(log.date).toLocaleDateString('sv-SE')}</span>
                                </div>

                                {log.companions && (
                                    <div className="flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[80px]">{log.companions}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Price badge */}
                        {log.wine?.price && (
                            <div className="text-right flex-shrink-0">
                                <span className="text-sm font-medium text-wine-red-light">
                                    {log.wine.price} kr
                                </span>
                            </div>
                        )}
                    </button>

                    {/* Delete button - always visible on mobile, hover on desktop */}
                    <button
                        onClick={(e) => handleDelete(e, log.id)}
                        disabled={deletingId === log.id}
                        className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                        title="Radera"
                    >
                        {deletingId === log.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Trash2 className="w-5 h-5" />
                        )}
                    </button>
                </div>
            ))}
        </div>
    );
}
