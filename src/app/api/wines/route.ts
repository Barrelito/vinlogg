import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { WineInsert } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Du måste vara inloggad' },
                { status: 401 }
            );
        }

        const body = await request.json();

        const wineEntry: WineInsert = {
            name: body.name,
            producer: body.producer || null,
            vintage: body.vintage || null,
            region: body.region || null,
            article_number: body.article_number || null,
            price: body.price || null,
            food_pairing_tags: body.food_pairing_tags || [],
            url_to_systembolaget: body.url_to_systembolaget || null,
            image_url: body.image_url || null,
        };

        // Check if wine already exists by article number
        if (wineEntry.article_number) {
            const { data: existing } = await supabase
                .from('wines')
                .select('*')
                .eq('article_number', wineEntry.article_number)
                .single();

            if (existing) {
                return NextResponse.json({ wine: existing });
            }
        }

        const { data: wine, error } = await supabase
            .from('wines')
            .insert(wineEntry)
            .select()
            .single();

        if (error) {
            console.error('Insert wine error:', error);
            return NextResponse.json(
                { error: 'Kunde inte spara vinet' },
                { status: 500 }
            );
        }

        return NextResponse.json({ wine });
    } catch (error) {
        console.error('Post wine error:', error);
        return NextResponse.json(
            { error: 'Ett fel uppstod' },
            { status: 500 }
        );
    }
}
