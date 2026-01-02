import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Get logged in user
            const { data: { user } } = await supabase.auth.getUser();

            if (user?.email) {
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
                await supabaseAdmin
                    .from('partners')
                    .update({
                        partner_user_id: user.id,
                        status: 'accepted',
                        updated_at: new Date().toISOString()
                    })
                    .eq('partner_email', user.email)
                    .eq('status', 'pending');
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return to home with error
    return NextResponse.redirect(`${origin}/?error=auth`);
}
