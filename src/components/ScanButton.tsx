'use client';

import { useRef, useState } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import type { Wine, WineAnalysisResult } from '@/lib/types';

interface ScanButtonProps {
    onScanComplete: (result: {
        analysisResult: WineAnalysisResult;
        wine: Wine | null;
        foundInDatabase: boolean;
        imageBase64: string;
    }) => void;
}

export function ScanButton({ onScanComplete }: ScanButtonProps) {
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsScanning(true);

        try {
            // Convert to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = (e) => resolve(e.target?.result as string);
            });
            reader.readAsDataURL(file);
            const base64Image = await base64Promise;

            // Call API
            const response = await fetch('/api/scan-wine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            onScanComplete({
                analysisResult: data.analysisResult,
                wine: data.wine,
                foundInDatabase: data.foundInDatabase || false,
                imageBase64: base64Image,
            });
        } catch (error) {
            console.error('Scan error:', error);
            alert('Kunde inte analysera bilden. Försök igen.');
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="relative">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="wine-button w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-white font-semibold text-lg disabled:opacity-50"
            >
                {isScanning ? (
                    <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Analyserar...
                    </>
                ) : (
                    <>
                        <Camera className="w-6 h-6" />
                        Skanna vinflaska
                    </>
                )}
            </button>

            {/* Alternative upload button */}
            <button
                onClick={() => {
                    if (fileInputRef.current) {
                        fileInputRef.current.removeAttribute('capture');
                        fileInputRef.current.click();
                        // Restore capture attribute after a short delay
                        setTimeout(() => {
                            if (fileInputRef.current) {
                                fileInputRef.current.setAttribute('capture', 'environment');
                            }
                        }, 100);
                    }
                }}
                disabled={isScanning}
                className="mt-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-white/60 transition-colors disabled:opacity-50"
            >
                <Upload className="w-4 h-4" />
                Ladda upp bild
            </button>
        </div>
    );
}
