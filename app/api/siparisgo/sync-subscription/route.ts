import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

// Internal API için rate limit (dakikada 10 istek)
const syncRateLimitConfig = {
    maxRequests: 10,
    windowMs: 60 * 1000 // 1 dakika
};

// SiparisGO veritabanına bağlanmak için ayrı client
// NOT: Bu environment variable'lar .env.local'a eklenmelidir
function getSiparisGOClient() {
    const url = process.env.SIPARISGO_SUPABASE_URL;
    const key = process.env.SIPARISGO_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('SiparisGO Supabase credentials not configured');
    }

    return createClient(url, key);
}

// Subscription type mapping
function getSubscriptionType(durationMonths: number): string {
    switch (durationMonths) {
        case 1:
            return 'monthly';
        case 3:
            return '3months';
        case 6:
            return '6months';
        case 12:
            return 'yearly';
        default:
            return 'monthly';
    }
}

// POST: SiparisGO cafes tablosunu güncelle
export async function POST(request: NextRequest) {
    try {
        const clientIP = getClientIP(request);

        // ======== RATE LIMITING (Brute-force koruması) ========
        const rateLimit = checkRateLimit(`siparisgo-sync:${clientIP}`, syncRateLimitConfig);

        if (!rateLimit.success) {
            console.warn(`[SiparisGO Sync] Rate limit exceeded for IP: ${clientIP}`);
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
            );
        }
        // ======================================================

        // API key kontrolü (güvenlik için)
        const apiKey = request.headers.get('x-api-key');
        if (apiKey !== process.env.INTERNAL_API_KEY) {
            console.warn(`[SiparisGO Sync] Invalid API key attempt from IP: ${clientIP}`);
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            owner_id,           // NPC'deki user_id (UUID)
            duration_months,    // Paket süresi
            auto_renew = false, // Otomatik yenileme
            extend = false      // Mevcut süreye ekle mi?
        } = body;

        if (!owner_id || !duration_months) {
            return NextResponse.json(
                { error: 'owner_id ve duration_months zorunludur' },
                { status: 400 }
            );
        }

        const siparisgo = getSiparisGOClient();

        // Mevcut cafe kaydını bul
        const { data: existingCafe, error: findError } = await siparisgo
            .from('cafes')
            .select('id, subscription_end_date')
            .eq('owner_id', owner_id)
            .single();

        if (findError && findError.code !== 'PGRST116') {
            console.error('[SiparisGO Sync] Find error:', findError);
            return NextResponse.json(
                { error: 'Cafe kaydı bulunamadı' },
                { status: 404 }
            );
        }

        // Yeni bitiş tarihini hesapla
        let newEndDate: Date;

        if (extend && existingCafe?.subscription_end_date) {
            // Mevcut süreye ekle
            const currentEndDate = new Date(existingCafe.subscription_end_date);
            const now = new Date();

            // Eğer mevcut süre geçmişse, bugünden itibaren hesapla
            const baseDate = currentEndDate > now ? currentEndDate : now;
            newEndDate = new Date(baseDate);
            newEndDate.setMonth(newEndDate.getMonth() + duration_months);
        } else {
            // Bugünden itibaren hesapla
            newEndDate = new Date();
            newEndDate.setMonth(newEndDate.getMonth() + duration_months);
        }

        const subscriptionType = getSubscriptionType(duration_months);

        // Cafe kaydını güncelle
        const { data: updatedCafe, error: updateError } = await siparisgo
            .from('cafes')
            .update({
                subscription_end_date: newEndDate.toISOString(),
                subscription_type: subscriptionType,
                auto_renew: auto_renew,
                is_active: true,
                is_frozen: false,
                frozen_at: null
            })
            .eq('owner_id', owner_id)
            .select()
            .single();

        if (updateError) {
            console.error('[SiparisGO Sync] Update error:', updateError);
            return NextResponse.json(
                { error: 'Cafe güncellenemedi' },
                { status: 500 }
            );
        }

        console.log('[SiparisGO Sync] Successfully updated cafe:', {
            cafe_id: updatedCafe.id,
            owner_id,
            new_end_date: newEndDate.toISOString(),
            subscription_type: subscriptionType
        });

        return NextResponse.json({
            success: true,
            cafe: {
                id: updatedCafe.id,
                subscription_end_date: newEndDate.toISOString(),
                subscription_type: subscriptionType,
                auto_renew
            }
        });
    } catch (error) {
        console.error('[SiparisGO Sync] Unexpected error:', error);

        // SiparisGO credentials yoksa graceful fail
        if (error instanceof Error && error.message.includes('credentials not configured')) {
            console.warn('[SiparisGO Sync] Credentials not configured, skipping sync');
            return NextResponse.json({
                success: false,
                warning: 'SiparisGO sync skipped - credentials not configured'
            });
        }

        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu' },
            { status: 500 }
        );
    }
}
