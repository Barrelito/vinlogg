'use client';

import { useState, useEffect } from 'react';
import { Users, X, Plus, Loader2, Check, UserPlus } from 'lucide-react';

interface Partner {
    id: string;
    user_id: string;
    partner_email: string;
    partner_user_id: string | null;
    status: string;
}

interface PartnerSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PartnerSettings({ isOpen, onClose }: PartnerSettingsProps) {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [pendingInvites, setPendingInvites] = useState<Partner[]>([]);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchPartners();
        }
    }, [isOpen]);

    const fetchPartners = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/partners');
            const data = await response.json();
            setPartners(data.partners || []);
            setPendingInvites(data.pendingInvites || []);
        } catch (error) {
            console.error('Fetch partners error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSending(true);
        setMessage(null);

        try {
            const response = await fetch('/api/partners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (data.error) {
                setMessage({ type: 'error', text: data.error });
            } else {
                setMessage({ type: 'success', text: data.message });
                setEmail('');
                fetchPartners();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Kunde inte skicka inbjudan' });
        } finally {
            setIsSending(false);
        }
    };

    const handleRemove = async (partnerId: string) => {
        if (!confirm('Vill du ta bort denna delning?')) return;

        try {
            await fetch('/api/partners', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partnerId }),
            });
            fetchPartners();
        } catch (error) {
            console.error('Remove partner error:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 glass-card rounded-3xl slide-up overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-wine-red/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-wine-red-light" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Delad Vinkällare</h2>
                            <p className="text-xs text-white/50">Bjud in din partner</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* Invite form */}
                    <form onSubmit={handleInvite} className="space-y-3">
                        <label className="text-sm text-white/60 block">
                            Bjud in med e-post
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="partner@example.com"
                                className="flex-1"
                            />
                            <button
                                type="submit"
                                disabled={isSending || !email.trim()}
                                className="wine-button px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <UserPlus className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Message */}
                    {message && (
                        <div className={`p-3 rounded-xl text-sm ${message.type === 'success'
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Partners list */}
                    <div className="space-y-3">
                        <h3 className="text-sm text-white/60">Delar vinkällare med:</h3>

                        {isLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                            </div>
                        ) : partners.length === 0 ? (
                            <p className="text-white/40 text-sm text-center py-4">
                                Ingen partner kopplad än
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {partners.map((partner) => (
                                    <div
                                        key={partner.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-wine-red/20 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-green-400" />
                                            </div>
                                            <span className="text-white text-sm">{partner.partner_email}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(partner.id)}
                                            className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-red-400"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info text */}
                    <p className="text-xs text-white/40 text-center">
                        När din partner loggar in med sin e-post kopplas era vinkällare automatiskt.
                        Alla viner visas sedan i en gemensam lista.
                    </p>
                </div>
            </div>
        </div>
    );
}
