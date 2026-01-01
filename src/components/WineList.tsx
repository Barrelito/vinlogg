'use client';

import { Wine, Star, MapPin, Calendar } from 'lucide-react';
import type { WineLog } from '@/lib/types';

interface WineListProps {
    logs: WineLog[];
    onSelect: (log: WineLog) => void;
}

export function WineList({ logs, onSelect }: WineListProps) {
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
                <button
                    key={log.id}
                    onClick={() => onSelect(log)}
                    className="glass-card w-full p-4 flex items-center gap-4 hover:bg-white/10 transition-all duration-200 slide-up text-left"
                    style={{ animationDelay: `${index * 50}ms` }}
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
            ))}
        </div>
    );
}
