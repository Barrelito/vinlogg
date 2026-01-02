import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch user's cellar items
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });
        }

        const { data: cellar, error } = await supabase
            .from('cellar')
            .select(`
                *,
                wine:wines(*)
            `)
            .eq('user_id', user.id)
            .gt('quantity', 0)
            .order('added_at', { ascending: false });

        if (error) {
            console.error('Cellar fetch error:', error);
            return NextResponse.json({ error: 'Kunde inte hämta hemmalager' }, { status: 500 });
        }

        return NextResponse.json({ cellar });
    } catch (error) {
        console.error('Cellar GET error:', error);
        return NextResponse.json({ error: 'Ett fel uppstod' }, { status: 500 });
    }
}

// POST - Add wine to cellar
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });
        }

        const body = await request.json();
        const { wine_id, quantity = 1, notes } = body;

        if (!wine_id) {
            return NextResponse.json({ error: 'wine_id krävs' }, { status: 400 });
        }

        // Check if wine already exists in cellar
        const { data: existing } = await supabase
            .from('cellar')
            .select('id, quantity')
            .eq('user_id', user.id)
            .eq('wine_id', wine_id)
            .single();

        if (existing) {
            // Update quantity
            const { data: updated, error } = await supabase
                .from('cellar')
                .update({
                    quantity: existing.quantity + quantity,
                    notes: notes || undefined,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select(`*, wine:wines(*)`)
                .single();

            if (error) {
                console.error('Cellar update error:', error);
                return NextResponse.json({ error: 'Kunde inte uppdatera' }, { status: 500 });
            }

            return NextResponse.json({ item: updated, action: 'updated' });
        }

        // Create new entry
        const { data: newItem, error } = await supabase
            .from('cellar')
            .insert({
                user_id: user.id,
                wine_id,
                quantity,
                notes
            })
            .select(`*, wine:wines(*)`)
            .single();

        if (error) {
            console.error('Cellar insert error:', error);
            return NextResponse.json({ error: 'Kunde inte lägga till' }, { status: 500 });
        }

        return NextResponse.json({ item: newItem, action: 'created' });
    } catch (error) {
        console.error('Cellar POST error:', error);
        return NextResponse.json({ error: 'Ett fel uppstod' }, { status: 500 });
    }
}

// PATCH - Update quantity
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });
        }

        const body = await request.json();
        const { id, quantity, notes } = body;

        if (!id) {
            return NextResponse.json({ error: 'id krävs' }, { status: 400 });
        }

        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (typeof quantity === 'number') {
            updates.quantity = Math.max(0, quantity);
        }
        if (notes !== undefined) {
            updates.notes = notes;
        }

        const { data: updated, error } = await supabase
            .from('cellar')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select(`*, wine:wines(*)`)
            .single();

        if (error) {
            console.error('Cellar PATCH error:', error);
            return NextResponse.json({ error: 'Kunde inte uppdatera' }, { status: 500 });
        }

        return NextResponse.json({ item: updated });
    } catch (error) {
        console.error('Cellar PATCH error:', error);
        return NextResponse.json({ error: 'Ett fel uppstod' }, { status: 500 });
    }
}

// DELETE - Remove from cellar
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id krävs' }, { status: 400 });
        }

        const { error } = await supabase
            .from('cellar')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Cellar DELETE error:', error);
            return NextResponse.json({ error: 'Kunde inte ta bort' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Cellar DELETE error:', error);
        return NextResponse.json({ error: 'Ett fel uppstod' }, { status: 500 });
    }
}
