'use client';

import { useState } from 'react';
import { X, Star, MapPin, ExternalLink, Wine, Save, Loader2, Thermometer, Clock, Sparkles, Users, Calendar, Package, Check, Trash2 } from 'lucide-react';
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
        companions?: string;
        occasion?: string;
        manualWine?: {
            name: string;
            producer?: string;
            vintage?: number;
            region?: string;
            food_pairing_tags?: string[];
            description?: string | null;
            serving_temperature?: string | null;
            storage_potential?: string | null;
            flavor_profile?: any;
        };
    }) => void;
    onAddToCellar?: (wineId: string) => Promise<void>;
    onDelete?: () => void;
}

// Helper component for flavor bars
const FlavorBar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-3 text-sm">
        <span className="w-20 text-white/60">{label}</span>
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
                className="h-full bg-wine-red-light rounded-full transition-all duration-500"
                style={{ width: `${(value / 5) * 100}%` }}
            />
        </div>
    </div>
);

export function WineDetailModal({
    wine,
    log,
    analysisResult,
    imageBase64,
    isManualEntry = false,
    onClose,
    onSave,
    onAddToCellar,
    onDelete,
}: WineDetailModalProps) {
    const [rating, setRating] = useState(log?.rating || 0);
    const [location, setLocation] = useState(log?.location_name || '');
    const [notes, setNotes] = useState(log?.notes || '');
    const [companions, setCompanions] = useState(log?.companions || '');
    const [occasion, setOccasion] = useState(log?.occasion || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingToCellar, setIsAddingToCellar] = useState(false);
    const [addedToCellar, setAddedToCellar] = useState(false);

    // Manual entry fields - pre-fill from analysisResult or wine
    const [manualName, setManualName] = useState(analysisResult?.name || wine?.name || '');
    const [manualProducer, setManualProducer] = useState(analysisResult?.producer || wine?.producer || '');
    const [manualVintage, setManualVintage] = useState((analysisResult?.vintage || wine?.vintage)?.toString() || '');
    const [manualRegion, setManualRegion] = useState(analysisResult?.region || wine?.region || '');

    // Extract detailed info from either analysis OR saved wine
    const description = analysisResult?.description || wine?.description;
    const servingTemp = analysisResult?.serving_temperature || wine?.serving_temperature;
    const storage = analysisResult?.storage_potential || wine?.storage_potential;
    const flavor = analysisResult?.flavor_profile || wine?.flavor_profile;
    const foodTags = analysisResult?.food_pairing_tags || wine?.food_pairing_tags || [];

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                wine_id: wine?.id,
                rating: rating || undefined,
                location_name: location || undefined,
                notes: notes || undefined,
                companions: companions || undefined,
                occasion: occasion || undefined,
                manualWine: isManualEntry ? {
                    name: manualName,
                    producer: manualProducer || undefined,
                    vintage: manualVintage ? parseInt(manualVintage) : undefined,
                    region: manualRegion || undefined,
                    description: analysisResult?.description,
                    serving_temperature: analysisResult?.serving_temperature,
                    storage_potential: analysisResult?.storage_potential,
                    flavor_profile: analysisResult?.flavor_profile,
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
                        <div className="space-y-6">
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
                                {foodTags.length > 0 && (
                                    <div className="mt-3">
                                        <span className="text-xs text-white/40 block mb-1.5">Passar till:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {foodTags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-3 py-1 rounded-full bg-wine-red/20 text-wine-red-light text-xs"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add to cellar button */}
                                {log && wine?.id && onAddToCellar && (
                                    <button
                                        onClick={async () => {
                                            setIsAddingToCellar(true);
                                            try {
                                                await onAddToCellar(wine.id);
                                                setAddedToCellar(true);
                                            } catch (error) {
                                                console.error('Failed to add to cellar:', error);
                                            } finally {
                                                setIsAddingToCellar(false);
                                            }
                                        }}
                                        disabled={isAddingToCellar || addedToCellar}
                                        className={`mt-3 w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${addedToCellar
                                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                            : 'bg-wine-red/20 text-wine-red-light border border-wine-red/30 hover:bg-wine-red/30'
                                            }`}
                                    >
                                        {isAddingToCellar ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Lägger till...</span>
                                            </>
                                        ) : addedToCellar ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>Tillagd i hemmalager!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Package className="w-4 h-4" />
                                                <span>Lägg i hemmalager</span>
                                            </>
                                        )}
                                    </button>

                                )}

                                {/* Delete log button - only for existing logs */}
                                {log && onDelete && (
                                    <button
                                        onClick={onDelete}
                                        className="mt-3 w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Ta bort från vinkällare</span>
                                    </button>
                                )}
                            </div>

                            {/* Advanced AI Insights */}
                            {(description || flavor) && (
                                <div className="bg-white/5 p-4 rounded-xl space-y-4">
                                    <div className="flex items-center gap-2 text-wine-red-light font-medium">
                                        <Sparkles className="w-4 h-4" />
                                        <span>Sommelierens Analys</span>
                                    </div>

                                    {description && (
                                        <p className="text-sm text-white/80 leading-relaxed italic">
                                            "{description}"
                                        </p>
                                    )}

                                    {flavor && (
                                        <div className="space-y-2 pt-2 border-t border-white/10">
                                            <FlavorBar label="Fyllighet" value={flavor.body} />
                                            <FlavorBar label="Syra" value={flavor.acidity} />
                                            <FlavorBar label="Strävhet" value={flavor.tannins} />
                                            <FlavorBar label="Fruktighet" value={flavor.fruitiness} />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                                        {servingTemp && (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-white/40">
                                                    <Thermometer className="w-3.5 h-3.5" />
                                                    <span>Temp</span>
                                                </div>
                                                <span className="text-sm text-white/80">{servingTemp}</span>
                                            </div>
                                        )}
                                        {storage && (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-white/40">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>Lagring</span>
                                                </div>
                                                <span className="text-sm text-white/80">{storage}</span>
                                            </div>
                                        )}
                                    </div>
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

                    {/* Companions */}
                    <div>
                        <label className="text-sm text-white/60 mb-1 block flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Med vem?
                        </label>
                        <input
                            type="text"
                            value={companions}
                            onChange={(e) => setCompanions(e.target.value)}
                            placeholder="T.ex. Anna, Erik"
                            className="w-full"
                        />
                    </div>

                    {/* Occasion */}
                    <div>
                        <label className="text-sm text-white/60 mb-1 block flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Tillfälle
                        </label>
                        <input
                            type="text"
                            value={occasion}
                            onChange={(e) => setOccasion(e.target.value)}
                            placeholder="T.ex. Födelsedag, After Work"
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
        </div >
    );
}
