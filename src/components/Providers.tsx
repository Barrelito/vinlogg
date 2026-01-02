'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { OfflineIndicator } from './OfflineIndicator';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ErrorBoundary>
            <OfflineIndicator />
            {children}
        </ErrorBoundary>
    );
}
