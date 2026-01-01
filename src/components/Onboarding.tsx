'use client';

import { useState, useEffect } from 'react';
import { Camera, Wine, Users, Search, ChevronRight, X, Sparkles } from 'lucide-react';

interface OnboardingProps {
    onComplete: () => void;
}

const STEPS = [
    {
        icon: Sparkles,
        title: 'Välkommen till VinLogg!',
        description: 'Din personliga sommelier i fickan. Skanna vinflaskor, få AI-analys och bygg din egen vinkällare.',
        color: 'from-wine-red to-wine-red-light',
    },
    {
        icon: Camera,
        title: 'Skanna vinflaskor',
        description: 'Ta en bild på etiketten så identifierar AI:n vinet och ger dig smakprofil, serveringstemperatur och matförslag.',
        color: 'from-purple-500 to-pink-500',
    },
    {
        icon: Wine,
        title: 'Bygg din vinkällare',
        description: 'Spara viner du smakat, ge betyg och anteckna vem du drack med och vid vilket tillfälle.',
        color: 'from-amber-500 to-orange-500',
    },
    {
        icon: Users,
        title: 'Dela med din partner',
        description: 'Bjud in din partner så får ni en gemensam vinkällare. Perfekt för par som älskar vin!',
        color: 'from-green-500 to-emerald-500',
    },
    {
        icon: Search,
        title: 'Hitta vin till maten',
        description: 'Skriv vad du ska äta så föreslår vi viner från din samling som passar perfekt.',
        color: 'from-blue-500 to-cyan-500',
    },
];

export function Onboarding({ onComplete }: OnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has seen onboarding
        const hasSeenOnboarding = localStorage.getItem('vinlogg_onboarding_complete');
        if (!hasSeenOnboarding) {
            setIsVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        localStorage.setItem('vinlogg_onboarding_complete', 'true');
        setIsVisible(false);
        onComplete();
    };

    const handleSkip = () => {
        handleComplete();
    };

    if (!isVisible) return null;

    const step = STEPS[currentStep];
    const Icon = step.icon;
    const isLastStep = currentStep === STEPS.length - 1;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            {/* Modal */}
            <div className="relative w-full max-w-sm mx-4 slide-up">
                {/* Skip button */}
                <button
                    onClick={handleSkip}
                    className="absolute -top-12 right-0 flex items-center gap-1 text-white/50 hover:text-white/80 text-sm transition-colors"
                >
                    Hoppa över
                    <X className="w-4 h-4" />
                </button>

                <div className="glass-card rounded-3xl overflow-hidden">
                    {/* Icon area */}
                    <div className={`bg-gradient-to-br ${step.color} p-8 flex justify-center`}>
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                            <Icon className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 text-center space-y-4">
                        <h2 className="text-xl font-bold text-white">{step.title}</h2>
                        <p className="text-white/70 text-sm leading-relaxed">{step.description}</p>

                        {/* Progress dots */}
                        <div className="flex justify-center gap-2 py-2">
                            {STEPS.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-all ${index === currentStep
                                            ? 'bg-wine-red-light w-6'
                                            : index < currentStep
                                                ? 'bg-wine-red/50'
                                                : 'bg-white/20'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Button */}
                        <button
                            onClick={handleNext}
                            className="wine-button w-full py-4 rounded-xl flex items-center justify-center gap-2 text-white font-semibold"
                        >
                            {isLastStep ? (
                                'Kom igång!'
                            ) : (
                                <>
                                    Nästa
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        {/* Login hint on first step */}
                        {currentStep === 0 && (
                            <p className="text-xs text-white/40">
                                Skapa ett konto för att spara dina viner permanent
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
