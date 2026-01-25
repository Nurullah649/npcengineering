import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { subscription_id } = await request.json()

        if (!subscription_id) {
            return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
        }

        // Admin Client (Veri düzeltmek için tam yetki)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        if (!supabaseKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Aboneliği çek
        const { data: sub, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('id', subscription_id)
            .single()

        if (subError || !sub) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
        }

        let fixed = false

        // 2. Eğer paket ID yoksa onar
        if (!sub.package_id) {
            // Süre farkını hesapla (Start - End)
            const start = new Date(sub.start_date)
            const end = new Date(sub.end_date)
            const diffMonths = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))

            // En yakın paketi bul (1, 3, 6, 12)
            // Eğer hesap tutmazsa default 1 (Aylık)
            const targetDuration = [1, 3, 6, 12].reduce((prev, curr) => {
                return (Math.abs(curr - diffMonths) < Math.abs(prev - diffMonths) ? curr : prev);
            });

            const { data: pkg } = await supabase
                .from('packages')
                .select('id')
                .eq('duration_months', targetDuration)
                // Birden fazla varsa ilkini al (örn: Standart vs Pro)
                .limit(1)
                .single()

            if (pkg) {
                await supabase
                    .from('subscriptions')
                    .update({ package_id: pkg.id })
                    .eq('id', subscription_id)

                fixed = true
            }
        }

        return NextResponse.json({ success: true, fixed })

    } catch (error) {
        console.error('Fix subscription error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
