import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { createClient as createAdminClient } from '@supabase/supabase-js';

// POST: Link pending partner invites to the logged-in user
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user?.email) {
            return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });
        }

        // Use admin client to bypass RLS for linking
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Link any pending partner invites for this email
        const { data, error } = await supabaseAdmin
            .from('partners')
            .update({
                partner_user_id: user.id,
                status: 'accepted',
                updated_at: new Date().toISOString()
            })
            .eq('partner_email', user.email)
            .eq('status', 'pending')
            .select();

        if (error) {
            console.error('Link partners error:', error);
            return NextResponse.json({ error: 'Kunde inte länka partners' }, { status: 500 });
        }

        return NextResponse.json({
            linked: data?.length || 0,
            message: data?.length ? `${data.length} partner(s) kopplades` : 'Inga väntande inbjudningar'
        });
    } catch (error) {
        console.error('Link partners error:', error);
        return NextResponse.json({ error: 'Ett fel uppstod' }, { status: 500 });
    }
}
