'use client';

import { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type AuthMode = 'login' | 'signup';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setIsLoading(true);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });

                if (error) {
                    setError(error.message);
                } else {
                    setMessage('Konto skapat! Kolla din e-post för att bekräfta kontot.');
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    if (error.message === 'Invalid login credentials') {
                        setError('Fel e-post eller lösenord');
                    } else if (error.message === 'Email not confirmed') {
                        setError('Du måste bekräfta din e-post först. Kolla din inkorg.');
                    } else {
                        setError(error.message);
                    }
                } else {
                    onSuccess();
                    onClose();
                }
            }
        } catch {
            setError('Något gick fel. Försök igen.');
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = () => {
        setMode(mode === 'login' ? 'signup' : 'login');
        setError(null);
        setMessage(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md glass-card rounded-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5 text-white/60" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {mode === 'login' ? 'Logga in' : 'Skapa konto'}
                    </h2>
                    <p className="text-white/60 text-sm mt-2">
                        {mode === 'login'
                            ? 'Logga in för att komma åt din vinkällare'
                            : 'Registrera dig för att spara dina viner'}
                    </p>
                </div>

                {/* Mode tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login'
                                ? 'bg-wine-red text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                    >
                        Logga in
                    </button>
                    <button
                        onClick={() => setMode('signup')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'signup'
                                ? 'bg-wine-red text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                    >
                        Skapa konto
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email field */}
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="E-postadress"
                            required
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-wine-red/50 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Password field */}
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Lösenord"
                            required
                            minLength={6}
                            className="w-full pl-11 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-wine-red/50 focus:outline-none transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/60"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    {mode === 'signup' && (
                        <p className="text-white/40 text-xs">
                            Lösenordet måste vara minst 6 tecken
                        </p>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Success message */}
                    {message && (
                        <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-sm">
                            {message}
                        </div>
                    )}

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-wine-red to-wine-red-light text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{mode === 'login' ? 'Loggar in...' : 'Skapar konto...'}</span>
                            </>
                        ) : (
                            <span>{mode === 'login' ? 'Logga in' : 'Skapa konto'}</span>
                        )}
                    </button>
                </form>

                {/* Switch mode */}
                <p className="text-center text-white/60 text-sm mt-6">
                    {mode === 'login' ? 'Har du inget konto?' : 'Har du redan ett konto?'}{' '}
                    <button
                        onClick={switchMode}
                        className="text-wine-red-light hover:underline"
                    >
                        {mode === 'login' ? 'Skapa konto' : 'Logga in'}
                    </button>
                </p>
            </div>
        </div>
    );
}
