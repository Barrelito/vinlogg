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

        // Get partner user IDs (both directions)
        const { data: partnerConnections } = await supabase
            .from('partners')
            .select('user_id, partner_user_id')
            .or(`user_id.eq.${user.id},partner_user_id.eq.${user.id}`)
            .eq('status', 'accepted');

        // Build list of user IDs to fetch logs for
        const userIds = [user.id];
        if (partnerConnections) {
            partnerConnections.forEach(p => {
                if (p.user_id !== user.id && p.user_id) userIds.push(p.user_id);
                if (p.partner_user_id !== user.id && p.partner_user_id) userIds.push(p.partner_user_id);
            });
        }

        const { data: logs, error } = await supabase
            .from('logs')
            .select(`
        *,
        wine:wines(*)
      `)
            .in('user_id', userIds)
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
            companions: body.companions || null,
            occasion: body.occasion || null,
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

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Du måste vara inloggad' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const logId = searchParams.get('id');

        if (!logId) {
            return NextResponse.json(
                { error: 'Inget log-ID angavs' },
                { status: 400 }
            );
        }

        // Delete the log (RLS ensures users can only delete their own)
        const { error } = await supabase
            .from('logs')
            .delete()
            .eq('id', logId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Delete log error:', error);
            return NextResponse.json(
                { error: 'Kunde inte radera vinet' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, deletedId: logId });
    } catch (error) {
        console.error('Delete log error:', error);
        return NextResponse.json(
            { error: 'Ett fel uppstod' },
            { status: 500 }
        );
    }
}

