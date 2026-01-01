import { NextRequest, NextResponse } from 'next/server';
import { mapFoodToTags } from '@/lib/openai';
import { createClient } from '@/lib/supabase/server';
import type { WineLog } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const { food } = await request.json();

        if (!food || typeof food !== 'string') {
            return NextResponse.json(
                { error: 'Ingen mat angiven' },
                { status: 400 }
            );
        }

        // Step 1: Map food description to Systembolaget tags
        const tags = await mapFoodToTags(food);

        if (tags.length === 0) {
            return NextResponse.json({
                success: true,
                tags: [],
                wines: [],
                message: 'Kunde inte matcha maten till några vin-kategorier',
            });
        }

        // Step 2: Query database for wines with matching food pairing tags
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Du måste vara inloggad för att söka' },
                { status: 401 }
            );
        }

        // Query wines that match any of the food tags
        // First get wine IDs with matching tags
        const { data: matchingWines } = await supabase
            .from('wines')
            .select('id')
            .overlaps('food_pairing_tags', tags);

        if (!matchingWines || matchingWines.length === 0) {
            return NextResponse.json({
                success: true,
                tags,
                wines: [],
                message: 'Inga viner i din källare matchar den maten',
            });
        }

        const wineIds = matchingWines.map(w => w.id);

        // Get user's logs for matching wines
        const { data: logs, error } = await supabase
            .from('logs')
            .select(`
        *,
        wine:wines(*)
      `)
            .eq('user_id', user.id)
            .in('wine_id', wineIds)
            .order('date', { ascending: false });

        if (error) {
            console.error('Query error:', error);
            return NextResponse.json(
                { error: 'Kunde inte hämta viner' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            tags,
            wines: logs as WineLog[],
        });
    } catch (error) {
        console.error('Search food error:', error);
        return NextResponse.json(
            { error: 'Ett fel uppstod vid sökning' },
            { status: 500 }
        );
    }
}
