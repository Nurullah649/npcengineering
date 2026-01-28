import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll() { },
            },
        }
    );

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if code already exists
        const { data: profile } = await supabase
            .from('profiles')
            .select('ref_code')
            .eq('id', user.id)
            .single();

        if (profile?.ref_code) {
            return NextResponse.json({ code: profile.ref_code });
        }

        // Generate code using DB function (we might need to call it manually or let a trigger handle update)
        // Since we defined a trigger `handle_profile_creation_referral` that works on INSERT, for UPDATE we need manual logic or an UPDATE trigger.
        // The previous migration handled INSERT. Let's do it via SQL RPC or manual update loop here.

        // Simplest: Call the function we defined in SQL if exposure is allowed, 
        // OR implement the generation logic in TS. let's use TS for simplicity with the API.

        let newCode = '';
        let isUnique = false;

        // Safety break
        let attempts = 0;
        while (!isUnique && attempts < 5) {
            attempts++;
            // Generate 8 char code
            newCode = Math.random().toString(36).substring(2, 10).toUpperCase();

            // Check uniqueness
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('ref_code', newCode)
                .single();

            if (!existing) {
                isUnique = true;
            }
        }

        if (!isUnique) {
            return NextResponse.json({ error: 'Could not generate unique code' }, { status: 500 });
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ ref_code: newCode })
            .eq('id', user.id);

        if (updateError) throw updateError;

        return NextResponse.json({ code: newCode });

    } catch (error) {
        console.error('Error generating referral code:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
