'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
        // Here you could send to error tracking service (Sentry, etc.)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">
                        Något gick fel
                    </h2>
                    <p className="text-white/60 text-sm mb-6 max-w-sm">
                        Ett oväntat fel uppstod. Försök att ladda om sidan eller prova igen.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wine-red hover:bg-wine-red-light transition-colors text-white"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Försök igen
                    </button>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre className="mt-6 p-4 bg-black/50 rounded-lg text-left text-xs text-red-300 overflow-auto max-w-full">
                            {this.state.error.message}
                            {'\n'}
                            {this.state.error.stack}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook for functional components to throw errors that ErrorBoundary catches
export function useErrorHandler() {
    const [, setError] = React.useState<Error | null>(null);

    return React.useCallback((error: Error) => {
        setError(() => {
            throw error;
        });
    }, []);
}
