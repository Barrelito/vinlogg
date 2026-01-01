import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Fetch user's partners (both ones they invited and were invited by)
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });
        }

        // Get all partner connections where user is either inviter or invitee
        const { data: partners, error } = await supabase
            .from('partners')
            .select('*')
            .or(`user_id.eq.${user.id},partner_user_id.eq.${user.id}`)
            .eq('status', 'accepted');

        if (error) {
            console.error('Fetch partners error:', error);
            return NextResponse.json({ error: 'Kunde inte hämta partners' }, { status: 500 });
        }

        // Also get pending invites where someone invited this user (by email)
        const { data: pendingInvites } = await supabase
            .from('partners')
            .select('*')
            .eq('partner_email', user.email)
            .eq('status', 'pending');

        return NextResponse.json({
            partners: partners || [],
            pendingInvites: pendingInvites || []
        });
    } catch (error) {
        console.error('Partners GET error:', error);
        return NextResponse.json({ error: 'Ett fel uppstod' }, { status: 500 });
    }
}

// POST: Invite a partner by email
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });
        }

        const body = await request.json();
        const partnerEmail = body.email?.toLowerCase().trim();

        if (!partnerEmail) {
            return NextResponse.json({ error: 'E-post krävs' }, { status: 400 });
        }

        if (partnerEmail === user.email) {
            return NextResponse.json({ error: 'Du kan inte bjuda in dig själv' }, { status: 400 });
        }

        // Check if partner already exists
        const { data: existing } = await supabase
            .from('partners')
            .select('id')
            .eq('user_id', user.id)
            .eq('partner_email', partnerEmail)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Denna person är redan inbjuden' }, { status: 400 });
        }

        // Check if the partner email exists as a user - if so, link them
        const { data: partnerUserData } = await supabase
            .from('auth.users')
            .select('id')
            .eq('email', partnerEmail)
            .single();

        // Create invite
        const { data: invite, error } = await supabase
            .from('partners')
            .insert({
                user_id: user.id,
                partner_email: partnerEmail,
                partner_user_id: partnerUserData?.id || null,
                status: partnerUserData ? 'accepted' : 'pending', // Auto-accept if user exists
            })
            .select()
            .single();

        if (error) {
            console.error('Create invite error:', error);
            return NextResponse.json({ error: 'Kunde inte skapa inbjudan' }, { status: 500 });
        }

        return NextResponse.json({
            invite,
            message: partnerUserData
                ? 'Partner tillagd! Ni delar nu vinkällare.'
                : 'Inbjudan skickad! Partnern kopplas när de loggar in.'
        });
    } catch (error) {
        console.error('Partners POST error:', error);
        return NextResponse.json({ error: 'Ett fel uppstod' }, { status: 500 });
    }
}

// DELETE: Remove a partner connection
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });
        }

        const body = await request.json();
        const partnerId = body.partnerId;

        if (!partnerId) {
            return NextResponse.json({ error: 'Partner ID krävs' }, { status: 400 });
        }

        const { error } = await supabase
            .from('partners')
            .delete()
            .eq('id', partnerId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Delete partner error:', error);
            return NextResponse.json({ error: 'Kunde inte ta bort partner' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Partners DELETE error:', error);
        return NextResponse.json({ error: 'Ett fel uppstod' }, { status: 500 });
    }
}
