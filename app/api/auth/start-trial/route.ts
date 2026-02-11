import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

// Trial için sıkı rate limit (saatte 2 istek)
const trialRateLimitConfig = {
    maxRequests: 2,
    windowMs: 60 * 60 * 1000 // 1 saat
};

export async function POST(request: NextRequest) {
    try {
        // ======== RATE LIMITING (Trial Abuse Koruması) ========
        const clientIP = getClientIP(request);
        const rateLimit = checkRateLimit(`start-trial:${clientIP}`, trialRateLimitConfig);

        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Çok fazla deneme isteği. Lütfen bekleyin.' },
                {
                    status: 429,
                    headers: { 'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString() }
                }
            );
        }
        // ======================================================

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

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Check if user already has a subscription or order for 'siparisgo'
        // We check for ANY subscription to avoid abusing the trial
        const { data: existingSubs, error: subError } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

        if (existingSubs && existingSubs.length > 0) {
            return NextResponse.json({ message: 'User already has a subscription' }, { status: 200 }); // Not an error, just skip
        }

        // 2. Find the Trial Package
        // We assume the trial package has duration_days = 7 and price = 0
        // OR we find by name "7 Günlük Deneme"
        const { data: trialPackage, error: pkgError } = await supabase
            .from('packages')
            .select('id, duration_days, product_id')
            .eq('name', '7 Günlük Deneme')
            .single();

        if (pkgError || !trialPackage) {
            console.error('Trial package not found');
            return NextResponse.json({ error: 'Trial configuration missing' }, { status: 500 });
        }

        // 3. Create a "Trial Order" (Price 0)
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                amount: 0,
                status: 'paid', // Immediately paid
                package_id: trialPackage.id,
                product_id: trialPackage.product_id
            })
            .select()
            .single();

        if (orderError) {
            console.error('Failed to create trial order:', orderError);
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        // 4. Create the Subscription
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (trialPackage.duration_days || 7));

        const { error: newSubError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: user.id,
                product_id: trialPackage.product_id,
                package_id: trialPackage.id,
                order_id: order.id,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active',
                // onboarding_status: 'pending' // Should be default
            });

        if (newSubError) {
            console.error('Failed to create trial subscription:', newSubError);
            return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Trial started', orderId: order.id });

    } catch (error) {
        console.error('Start trial error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
