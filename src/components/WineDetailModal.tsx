'use client';

import { useState } from 'react';
import { X, Star, MapPin, ExternalLink, Wine, Save, Loader2 } from 'lucide-react';
import type { Wine as WineType, WineLog, WineAnalysisResult } from '@/lib/types';

interface WineDetailModalProps {
    wine?: WineType | null;
    log?: WineLog | null;
    analysisResult?: WineAnalysisResult | null;
    imageBase64?: string;
    isManualEntry?: boolean;
    onClose: () => void;
    onSave: (data: {
        wine_id?: string;
        rating?: number;
        location_name?: string;
        notes?: string;
        manualWine?: {
            name: string;
            producer?: string;
            vintage?: number;
            region?: string;
            food_pairing_tags?: string[];
        };
    }) => void;
}

export function WineDetailModal({
    wine,
    log,
    analysisResult,
    imageBase64,
    isManualEntry = false,
    onClose,
    onSave,
}: WineDetailModalProps) {
    const [rating, setRating] = useState(log?.rating || 0);
    const [location, setLocation] = useState(log?.location_name || '');
    const [notes, setNotes] = useState(log?.notes || '');
    const [isSaving, setIsSaving] = useState(false);

    // Manual entry fields - pre-fill from analysisResult or wine
    const [manualName, setManualName] = useState(analysisResult?.name || wine?.name || '');
    const [manualProducer, setManualProducer] = useState(analysisResult?.producer || wine?.producer || '');
    const [manualVintage, setManualVintage] = useState((analysisResult?.vintage || wine?.vintage)?.toString() || '');
    const [manualRegion, setManualRegion] = useState(analysisResult?.region || wine?.region || '');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                wine_id: wine?.id,
                rating: rating || undefined,
                location_name: location || undefined,
                notes: notes || undefined,
                manualWine: isManualEntry ? {
                    name: manualName,
                    producer: manualProducer || undefined,
                    vintage: manualVintage ? parseInt(manualVintage) : undefined,
                    region: manualRegion || undefined,
                } : undefined,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card rounded-t-3xl sm:rounded-3xl slide-up">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-inherit backdrop-blur-md">
                    <h2 className="text-lg font-semibold text-white">
                        {isManualEntry ? 'Lägg till vin manuellt' : 'Vindetaljer'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* Wine image */}
                    {(imageBase64 || wine?.image_url) && (
                        <div className="w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-wine-red/20 to-wine-red/5">
                            <img
                                src={imageBase64 || wine?.image_url || ''}
                                alt={wine?.name || 'Vin'}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}

                    {/* Wine info or manual entry form */}
                    {isManualEntry ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-white/60 mb-1 block">Vinnamn *</label>
                                <input
                                    type="text"
                                    value={manualName}
                                    onChange={(e) => setManualName(e.target.value)}
                                    placeholder="T.ex. Amarone della Valpolicella"
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-white/60 mb-1 block">Producent</label>
                                <input
                                    type="text"
                                    value={manualProducer}
                                    onChange={(e) => setManualProducer(e.target.value)}
                                    placeholder="T.ex. Bertani"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-white/60 mb-1 block">Årgång</label>
                                    <input
                                        type="number"
                                        value={manualVintage}
                                        onChange={(e) => setManualVintage(e.target.value)}
                                        placeholder="2020"
                                        min="1900"
                                        max="2030"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-white/60 mb-1 block">Region</label>
                                    <input
                                        type="text"
                                        value={manualRegion}
                                        onChange={(e) => setManualRegion(e.target.value)}
                                        placeholder="T.ex. Veneto"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">{wine?.name}</h3>
                            {wine?.producer && (
                                <p className="text-white/60">{wine.producer}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-white/40">
                                {wine?.vintage && <span>{wine.vintage}</span>}
                                {wine?.region && <span>{wine.region}</span>}
                            </div>
                            {wine?.price && (
                                <p className="text-wine-red-light font-semibold">{wine.price} kr</p>
                            )}
                            {wine?.url_to_systembolaget && (
                                <a
                                    href={wine.url_to_systembolaget}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-wine-red-light hover:text-wine-red transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Se på Systembolaget
                                </a>
                            )}
                            {wine?.food_pairing_tags && wine.food_pairing_tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {wine.food_pairing_tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 rounded-full bg-wine-red/20 text-wine-red-light text-xs"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rating */}
                    <div>
                        <label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Betyg
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    onClick={() => setRating(value)}
                                    className="p-2 transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-8 h-8 ${value <= rating
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-white/20'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="text-sm text-white/60 mb-1 block flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Plats
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="T.ex. Stockholms Stadshus"
                            className="w-full"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-sm text-white/60 mb-1 block flex items-center gap-2">
                            <Wine className="w-4 h-4" />
                            Anteckningar
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Hur smakade vinet? Vad åt du till?"
                            className="w-full min-h-[100px] resize-none"
                        />
                    </div>

                    {/* Save button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || (isManualEntry && !manualName.trim())}
                        className="wine-button w-full py-4 rounded-xl flex items-center justify-center gap-2 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Sparar...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Spara i vinkällaren
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
