'use client';

import { useState, useEffect, useMemo } from 'react';
import { Wine, Search, User, LogIn, TrendingUp, Users, Star } from 'lucide-react';
import { ScanButton } from '@/components/ScanButton';
import { WineList } from '@/components/WineList';
import { FoodSearch } from '@/components/FoodSearch';
import { StatsView } from '@/components/StatsView';
import { PartnerSettings } from '@/components/PartnerSettings';
import { Onboarding } from '@/components/Onboarding';
import { AuthModal } from '@/components/AuthModal';
import { WineDetailModal } from '@/components/WineDetailModal';
import { PageSkeleton } from '@/components/Skeleton';
import { createClient } from '@/lib/supabase/client';
import type { Wine as WineType, WineLog, WineAnalysisResult } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';

type ViewMode = 'cellar' | 'search' | 'stats';

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
  const [cellarSearch, setCellarSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showPartnerSettings, setShowPartnerSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  // Filter logs based on cellar search and favorites
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // Apply favorites filter first
    if (showFavoritesOnly) {
      filtered = filtered.filter(log => log.rating && log.rating >= 4);
    }

    // Apply search filter
    if (cellarSearch.trim()) {
      const search = cellarSearch.toLowerCase();
      filtered = filtered.filter(log =>
        log.wine?.name?.toLowerCase().includes(search) ||
        log.companions?.toLowerCase().includes(search) ||
        log.occasion?.toLowerCase().includes(search) ||
        log.location_name?.toLowerCase().includes(search) ||
        log.wine?.region?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [logs, cellarSearch, showFavoritesOnly]);

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
    companions?: string;
    occasion?: string;
    manualWine?: {
      name: string;
      producer?: string;
      vintage?: number;
      region?: string;
      description?: string | null;
      serving_temperature?: string | null;
      storage_potential?: string | null;
      flavor_profile?: any;
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
          companions: data.companions,
          occasion: data.occasion,
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

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setLogs([]);
  };

  if (isLoading) {
    return <PageSkeleton />;
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPartnerSettings(true)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Delad Vinkällare"
              >
                <Users className="w-5 h-5 text-white/60" />
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <User className="w-5 h-5 text-white/60" />
                <span className="text-sm text-white/60 hidden sm:inline">Logga ut</span>
              </button>
            </div>
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
            className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 transition-all ${viewMode === 'cellar'
              ? 'bg-wine-red/30 text-wine-red-light'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
          >
            <Wine className="w-5 h-5" />
            <span className="hidden sm:inline">Vinkällare</span>
            {logs.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-wine-red/50 text-xs">
                {logs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setViewMode('stats')}
            className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 transition-all ${viewMode === 'stats'
              ? 'bg-wine-red/30 text-wine-red-light'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="hidden sm:inline">Statistik</span>
          </button>

          <button
            onClick={() => setViewMode('search')}
            className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 transition-all ${viewMode === 'search'
              ? 'bg-wine-red/30 text-wine-red-light'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
          >
            <Search className="w-5 h-5" />
            <span className="hidden sm:inline">Mat & Vin</span>
          </button>
        </div>

        {/* Content */}
        {viewMode === 'cellar' ? (
          <section className="space-y-4">
            {/* Cellar search and filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={cellarSearch}
                  onChange={(e) => setCellarSearch(e.target.value)}
                  placeholder="Sök på vin, person, plats..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 text-sm"
                />
              </div>
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${showFavoritesOnly
                    ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                title="Visa bara favoriter (4-5 stjärnor)"
              >
                <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-yellow-300' : ''}`} />
                <span className="text-sm hidden sm:inline">Favoriter</span>
              </button>
            </div>

            {/* Results count when filtering */}
            {(showFavoritesOnly || cellarSearch) && (
              <p className="text-sm text-white/50">
                {filteredLogs.length} vin{filteredLogs.length !== 1 ? 'er' : ''}
                {showFavoritesOnly && ' med 4-5 stjärnor'}
              </p>
            )}

            <WineList
              logs={filteredLogs}
              onSelect={handleSelectLog}
              onDelete={(logId) => setLogs(prev => prev.filter(l => l.id !== logId))}
            />
          </section>
        ) : viewMode === 'stats' ? (
          <section>
            <StatsView logs={logs} />
          </section>
        ) : (
          <section className="space-y-4">
            <FoodSearch onResults={handleFoodSearchResults} />
            {searchResults.length > 0 && (
              <div>
                <h3 className="text-sm text-white/60 mb-3">
                  {searchResults.length} vin{searchResults.length !== 1 ? 'er' : ''} matchar
                </h3>
                <WineList
                  logs={searchResults}
                  onSelect={handleSelectLog}
                  onDelete={(logId) => {
                    setSearchResults(prev => prev.filter(l => l.id !== logId));
                    setLogs(prev => prev.filter(l => l.id !== logId));
                  }}
                />
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

      {/* Partner Settings Modal */}
      <PartnerSettings
        isOpen={showPartnerSettings}
        onClose={() => setShowPartnerSettings(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => fetchLogs()}
      />

      {/* First-time visitor onboarding */}
      <Onboarding onComplete={() => { }} />
    </main>
  );
}
