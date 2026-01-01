'use client';

import { useMemo } from 'react';
import { Wine, Star, MapPin, Globe, TrendingUp, Award } from 'lucide-react';
import type { WineLog } from '@/lib/types';

interface StatsViewProps {
    logs: WineLog[];
}

export function StatsView({ logs }: StatsViewProps) {
    const stats = useMemo(() => {
        if (!logs.length) return null;

        const totalWines = logs.length;
        const totalRating = logs.reduce((acc, log) => acc + (log.rating || 0), 0);
        const averageRating = (totalRating / logs.filter(l => l.rating).length) || 0;

        // Count regions
        const regions: Record<string, number> = {};
        logs.forEach(log => {
            if (log.wine?.region) {
                regions[log.wine.region] = (regions[log.wine.region] || 0) + 1;
            }
        });

        // Sort regions
        const topRegions = Object.entries(regions)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        // Calculate rating distribution
        const ratingDist = [0, 0, 0, 0, 0];
        logs.forEach(log => {
            if (log.rating && log.rating >= 1 && log.rating <= 5) {
                ratingDist[log.rating - 1]++;
            }
        });

        // Count unique producers
        const producers = new Set(logs.map(l => l.wine?.producer).filter(Boolean)).size;

        return {
            totalWines,
            averageRating,
            topRegions,
            ratingDist,
            producers
        };
    }, [logs]);

    if (!stats || logs.length === 0) {
        return (
            <div className="text-center py-12 text-white/40">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Ingen statistik än</p>
                <p className="text-sm mt-2">Logga några viner för att se dina trender</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 slide-up">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-wine-red/20 flex items-center justify-center mb-2">
                        <Wine className="w-5 h-5 text-wine-red-light" />
                    </div>
                    <span className="text-2xl font-bold text-white">{stats.totalWines}</span>
                    <span className="text-xs text-white/60">Loggade viner</span>
                </div>
                <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2">
                        <Star className="w-5 h-5 text-yellow-400" />
                    </div>
                    <span className="text-2xl font-bold text-white">{stats.averageRating.toFixed(1)}</span>
                    <span className="text-xs text-white/60">Snittbetyg</span>
                </div>
            </div>

            {/* Top Regions */}
            {stats.topRegions.length > 0 && (
                <div className="glass-card p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 text-white/80 font-medium">
                        <Globe className="w-4 h-4" />
                        <h3>Toppregioner</h3>
                    </div>
                    <div className="space-y-3">
                        {stats.topRegions.map(([region, count], index) => (
                            <div key={region} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-white">{region}</span>
                                        <span className="text-white/60">{count} st</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-wine-red-light rounded-full"
                                            style={{ width: `${(count / stats.totalWines) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Rating Distribution */}
            <div className="glass-card p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-white/80 font-medium">
                    <Award className="w-4 h-4" />
                    <h3>Betygsfördelning</h3>
                </div>
                <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                        const count = stats.ratingDist[stars - 1];
                        const percentage = (count / stats.totalWines) * 100;
                        return (
                            <div key={stars} className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1 w-12 text-white/60">
                                    <span>{stars}</span>
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                </div>
                                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-wine-red to-wine-red-light rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="w-8 text-right text-white/40 text-xs">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Unique Producers Badge */}
            <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
                <div>
                    <span className="text-sm text-white/60 block">Samlingen innehåller</span>
                    <span className="text-white font-medium">Viner från {stats.producers} olika producenter</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white/60" />
                </div>
            </div>
        </div>
    );
}
