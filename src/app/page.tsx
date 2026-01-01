'use client';

import { useState, useEffect, useMemo } from 'react';
import { Wine, Search, User, LogIn } from 'lucide-react';
import { ScanButton } from '@/components/ScanButton';
import { WineList } from '@/components/WineList';
import { FoodSearch } from '@/components/FoodSearch';
import { WineDetailModal } from '@/components/WineDetailModal';
import { createClient } from '@/lib/supabase/client';
import type { Wine as WineType, WineLog, WineAnalysisResult } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';

type ViewMode = 'cellar' | 'search';

interface ScanResult {
  analysisResult: WineAnalysisResult;
  wine: WineType | null;
  foundInDatabase: boolean;
  imageBase64: string;
}

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('cellar');
  const [logs, setLogs] = useState<WineLog[]>([]);
  const [searchResults, setSearchResults] = useState<WineLog[]>([]);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WineLog | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Create Supabase client only after mounting
  const supabase = useMemo<SupabaseClient | null>(() => {
    if (!isMounted) return null;
    try {
      return createClient();
    } catch {
      return null;
    }
  }, [isMounted]);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check auth and fetch logs
  useEffect(() => {
    if (!supabase) return;

    const checkAuthAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await fetchLogs();
      }
      setIsLoading(false);
    };

    checkAuthAndFetch();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchLogs();
        } else {
          setLogs([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      const data = await response.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleScanComplete = (result: ScanResult) => {
    setScanResult(result);
    setShowModal(true);
  };

  const handleSelectLog = (log: WineLog) => {
    setSelectedLog(log);
    setScanResult(null);
    setShowModal(true);
  };

  const handleFoodSearchResults = (results: WineLog[], tags: string[]) => {
    setSearchResults(results);
    setSearchTags(tags);
  };

  const handleSaveLog = async (data: {
    wine_id?: string;
    rating?: number;
    location_name?: string;
    notes?: string;
    manualWine?: {
      name: string;
      producer?: string;
      vintage?: number;
      region?: string;
    };
  }) => {
    try {
      let wineId = data.wine_id;

      // If manual entry, create wine first
      if (data.manualWine) {
        const wineResponse = await fetch('/api/wines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.manualWine),
        });
        const wineData = await wineResponse.json();
        if (wineData.wine) {
          wineId = wineData.wine.id;
        }
      }

      // Upload image if available
      let userImageUrl: string | undefined;
      if (scanResult?.imageBase64 && user && supabase) {
        const base64Data = scanResult.imageBase64.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('wine-images')
          .upload(fileName, blob);

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('wine-images')
            .getPublicUrl(fileName);
          userImageUrl = publicUrl;
        }
      }

      // Create log entry
      const logResponse = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wine_id: wineId,
          rating: data.rating,
          location_name: data.location_name,
          notes: data.notes,
          user_image_url: userImageUrl,
        }),
      });

      const logData = await logResponse.json();

      if (logData.log) {
        setLogs((prev) => [logData.log, ...prev]);
      }

      setShowModal(false);
      setScanResult(null);
      setSelectedLog(null);
    } catch (error) {
      console.error('Error saving log:', error);
      alert('Kunde inte spara. Försök igen.');
    }
  };

  const handleSignIn = async () => {
    if (!supabase) return;

    const email = prompt('Ange din e-postadress för att logga in:');
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Sign in error:', error);
      alert('Kunde inte skicka inloggningslänk. Försök igen.');
    } else {
      alert('✉️ Kolla din e-post! Vi har skickat en inloggningslänk till ' + email);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setLogs([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wine-red to-wine-red-light flex items-center justify-center">
              <Wine className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">VinLogg</h1>
          </div>

          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <User className="w-5 h-5 text-white/60" />
              <span className="text-sm text-white/60">Logga ut</span>
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wine-red/80 hover:bg-wine-red transition-colors"
            >
              <LogIn className="w-4 h-4 text-white" />
              <span className="text-sm text-white">Logga in</span>
            </button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Scan button */}
        <section>
          <ScanButton onScanComplete={handleScanComplete} />
        </section>

        {/* Tab navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('cellar')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${viewMode === 'cellar'
              ? 'bg-wine-red/30 text-wine-red-light'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
          >
            <Wine className="w-5 h-5" />
            <span>Min Vinkällare</span>
            {logs.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-wine-red/50 text-xs">
                {logs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode('search')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${viewMode === 'search'
              ? 'bg-wine-red/30 text-wine-red-light'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
          >
            <Search className="w-5 h-5" />
            <span>Vad äter du?</span>
          </button>
        </div>

        {/* Content */}
        {viewMode === 'cellar' ? (
          <section>
            <WineList logs={logs} onSelect={handleSelectLog} />
          </section>
        ) : (
          <section className="space-y-4">
            <FoodSearch onResults={handleFoodSearchResults} />
            {searchResults.length > 0 && (
              <div>
                <h3 className="text-sm text-white/60 mb-3">
                  {searchResults.length} vin{searchResults.length !== 1 ? 'er' : ''} matchar
                </h3>
                <WineList logs={searchResults} onSelect={handleSelectLog} />
              </div>
            )}
          </section>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <WineDetailModal
          wine={scanResult?.wine || selectedLog?.wine}
          log={selectedLog}
          analysisResult={scanResult?.analysisResult}
          imageBase64={scanResult?.imageBase64}
          isManualEntry={scanResult !== null && !scanResult.foundInDatabase}
          onClose={() => {
            setShowModal(false);
            setScanResult(null);
            setSelectedLog(null);
          }}
          onSave={handleSaveLog}
        />
      )}
    </main>
  );
}
