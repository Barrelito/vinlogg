'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
    // Only create client in browser environment with env vars available
    if (typeof window === 'undefined') {
        // Return a mock for SSR - actual calls happen client-side
        throw new Error('Supabase client should only be used on the client side');
    }

    if (!supabaseClient) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase environment variables');
        }

        supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }

    return supabaseClient;
}
