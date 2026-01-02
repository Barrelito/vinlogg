'use client';

import { useMemo } from 'react';
import { Star, ChevronRight } from 'lucide-react';
import type { WineLog } from '@/lib/types';

interface BraValProps {
    logs: WineLog[];
    onSelectLog: (log: WineLog) => void;
}

// Food category icons and labels
const FOOD_CATEGORIES: Record<string, { icon: string; label: string }> = {
    'Nöt': { icon: '🥩', label: 'Nötkött' },
    'Lamm': { icon: '🍖', label: 'Lamm' },
    'Fläsk': { icon: '🥓', label: 'Fläsk' },
    'Fågel': { icon: '🍗', label: 'Fågel' },
    'Vilt': { icon: '🦌', label: 'Vilt' },
    'Ljust kött': { icon: '🍖', label: 'Ljust kött' },
    'Fisk': { icon: '🐟', label: 'Fisk' },
    'Skaldjur': { icon: '🦐', label: 'Skaldjur' },
    'Vegetariskt': { icon: '🥗', label: 'Vegetariskt' },
    'Sällskapsdryck': { icon: '🥂', label: 'Tilltugg' },
};

export function BraVal({ logs, onSelectLog }: BraValProps) {
    // Get favorites (4-5 stars) grouped by food pairing tags
    const groupedFavorites = useMemo(() => {
        const favorites = logs.filter(log => log.rating && log.rating >= 4);
        const groups: Record<string, WineLog[]> = {};

        favorites.forEach(log => {
            const tags = log.wine?.food_pairing_tags || [];
            tags.forEach(tag => {
                if (!groups[tag]) {
                    groups[tag] = [];
                }
                // Avoid duplicates in same category
                if (!groups[tag].find(l => l.id === log.id)) {
                    groups[tag].push(log);
                }
            });
        });

        // Sort each group by rating (highest first)
        Object.keys(groups).forEach(tag => {
            groups[tag].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        });

        return groups;
    }, [logs]);

    const categories = Object.keys(groupedFavorites).filter(
        tag => FOOD_CATEGORIES[tag] && groupedFavorites[tag].length > 0
    );

    if (categories.length === 0) {
        return (
            <div className="glass-card rounded-xl p-6 text-center">
                <Star className="w-12 h-12 text-yellow-500/50 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Inga favoriter ännu</h3>
                <p className="text-white/60 text-sm">
                    Betygsätt viner med 4-5 stjärnor så dyker de upp här, grupperade efter mattyp.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <h2 className="text-lg font-semibold text-white">Bra val till...</h2>
            </div>

            <div className="grid gap-3">
                {categories.map(tag => {
                    const category = FOOD_CATEGORIES[tag];
                    const wines = groupedFavorites[tag];
                    const topWine = wines[0];

                    return (
                        <button
                            key={tag}
                            onClick={() => onSelectLog(topWine)}
                            className="glass-card rounded-xl p-4 text-left hover:bg-white/10 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                {/* Food icon */}
                                <div className="w-12 h-12 rounded-xl bg-wine-red/20 flex items-center justify-center text-2xl">
                                    {category.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-white truncate">
                                        {category.label}
                                    </h3>
                                    <p className="text-sm text-white/60 truncate">
                                        {topWine.wine?.name || 'Okänt vin'}
                                        {wines.length > 1 && (
                                            <span className="text-wine-red-light ml-1">
                                                +{wines.length - 1} till
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-0.5 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-3 h-3 ${i < (topWine.rating || 0)
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-white/20'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Arrow */}
                                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
