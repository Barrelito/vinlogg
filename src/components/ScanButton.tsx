'use client';

import { useRef, useState } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import type { Wine } from '@/lib/types';

interface ScanButtonProps {
    onScanComplete: (result: {
        visionResult: {
            name: string;
            producer: string | null;
            vintage: number | null;
            region: string | null;
        };
        wine: Wine | null;
        foundOnSystembolaget: boolean;
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
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // Send to API
            const response = await fetch('/api/scan-wine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64 }),
            });

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            onScanComplete({
                ...result,
                imageBase64: base64,
            });
        } catch (error) {
            console.error('Scan error:', error);
            alert('Ett fel uppstod vid skanning. Försök igen.');
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isScanning}
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="wine-button pulse-glow w-full py-6 px-8 rounded-2xl flex items-center justify-center gap-4 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isScanning ? (
                    <>
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span>Analyserar...</span>
                    </>
                ) : (
                    <>
                        <Camera className="w-8 h-8" />
                        <span>Skanna Flaska</span>
                    </>
                )}
            </button>

            <button
                onClick={() => {
                    if (fileInputRef.current) {
                        fileInputRef.current.removeAttribute('capture');
                        fileInputRef.current.click();
                        setTimeout(() => {
                            fileInputRef.current?.setAttribute('capture', 'environment');
                        }, 100);
                    }
                }}
                disabled={isScanning}
                className="mt-3 w-full py-3 px-6 rounded-xl flex items-center justify-center gap-3 text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 disabled:opacity-50"
            >
                <Upload className="w-5 h-5" />
                <span>Ladda upp bild</span>
            </button>
        </>
    );
}
