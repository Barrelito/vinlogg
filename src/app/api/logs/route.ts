import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { WineLogInsert } from '@/lib/types';

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Du måste vara inloggad' },
                { status: 401 }
            );
        }

        const { data: logs, error } = await supabase
            .from('logs')
            .select(`
        *,
        wine:wines(*)
      `)
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (error) {
            console.error('Get logs error:', error);
            return NextResponse.json(
                { error: 'Kunde inte hämta viner' },
                { status: 500 }
            );
        }

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('Get logs error:', error);
        return NextResponse.json(
            { error: 'Ett fel uppstod' },
            { status: 500 }
        );
    }
}

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

        const logEntry: WineLogInsert = {
            user_id: user.id,
            wine_id: body.wine_id || null,
            user_image_url: body.user_image_url || null,
            rating: body.rating || null,
            location_name: body.location_name || null,
            latitude: body.latitude || null,
            longitude: body.longitude || null,
            date: body.date || new Date().toISOString().split('T')[0],
            notes: body.notes || null,
        };

        const { data: log, error } = await supabase
            .from('logs')
            .insert(logEntry)
            .select(`
        *,
        wine:wines(*)
      `)
            .single();

        if (error) {
            console.error('Insert log error:', error);
            return NextResponse.json(
                { error: 'Kunde inte spara vinet' },
                { status: 500 }
            );
        }

        return NextResponse.json({ log });
    } catch (error) {
        console.error('Post log error:', error);
        return NextResponse.json(
            { error: 'Ett fel uppstod' },
            { status: 500 }
        );
    }
}
