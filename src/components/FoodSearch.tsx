'use client';

import { useState } from 'react';
import { Search, Utensils, Loader2, Wine } from 'lucide-react';
import type { WineLog } from '@/lib/types';

interface FoodSearchProps {
    onResults: (logs: WineLog[], tags: string[]) => void;
}

export function FoodSearch({ onResults }: FoodSearchProps) {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [lastTags, setLastTags] = useState<string[]>([]);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsSearching(true);

        try {
            const response = await fetch('/api/search-food', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ food: query }),
            });

            const result = await response.json();

            if (result.error) {
                if (result.error.includes('inloggad')) {
                    alert('Du måste vara inloggad för att söka');
                } else {
                    throw new Error(result.error);
                }
                return;
            }

            setLastTags(result.tags || []);
            onResults(result.wines || [], result.tags || []);
        } catch (error) {
            console.error('Search error:', error);
            alert('Ett fel uppstod vid sökning. Försök igen.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const quickSuggestions = [
        { label: 'Nötkött', icon: '🥩' },
        { label: 'Fisk', icon: '🐟' },
        { label: 'Pasta', icon: '🍝' },
        { label: 'Ost', icon: '🧀' },
    ];

    return (
        <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
                <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Vad äter du? (t.ex. Kalv, Pasta, Sushi)"
                    className="w-full pl-12 pr-12 py-4 rounded-xl"
                    disabled={isSearching}
                />
                <button
                    onClick={handleSearch}
                    disabled={isSearching || !query.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-wine-red/80 hover:bg-wine-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSearching ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                        <Search className="w-5 h-5 text-white" />
                    )}
                </button>
            </div>

            {/* Quick suggestions */}
            <div className="flex gap-2 flex-wrap">
                {quickSuggestions.map((suggestion) => (
                    <button
                        key={suggestion.label}
                        onClick={() => {
                            setQuery(suggestion.label);
                        }}
                        className="glass-card px-3 py-1.5 text-sm flex items-center gap-1.5 hover:bg-white/10 transition-colors"
                    >
                        <span>{suggestion.icon}</span>
                        <span>{suggestion.label}</span>
                    </button>
                ))}
            </div>

            {/* Show matched tags */}
            {lastTags.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                    <Wine className="w-4 h-4" />
                    <span>Matchar:</span>
                    {lastTags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-wine-red/30 text-wine-red-light text-xs">
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
