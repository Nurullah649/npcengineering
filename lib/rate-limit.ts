import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limit store
// NOT: Production'da Redis kullanılmalı - bu sadece single-instance için
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
    maxRequests: number;  // Maksimum istek sayısı
    windowMs: number;     // Zaman penceresi (ms)
}

// Varsayılan config
const defaultConfig: RateLimitConfig = {
    maxRequests: 10,
    windowMs: 60 * 1000 // 1 dakika
};

/**
 * Rate limit kontrolü yapar
 * @param identifier - Kullanıcı ID veya IP adresi
 * @param config - Rate limit konfigürasyonu
 * @returns { success: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = defaultConfig
): { success: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const key = identifier;

    // Mevcut kayıt
    const record = rateLimitStore.get(key);

    // Süre dolmuşsa veya kayıt yoksa yeni kayıt oluştur
    if (!record || now > record.resetTime) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs
        });
        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetIn: config.windowMs
        };
    }

    // Limit aşıldı mı?
    if (record.count >= config.maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetIn: record.resetTime - now
        };
    }

    // Sayacı artır
    record.count++;
    rateLimitStore.set(key, record);

    return {
        success: true,
        remaining: config.maxRequests - record.count,
        resetIn: record.resetTime - now
    };
}

/**
 * IP adresini al (Vercel/Cloudflare uyumlu)
 */
export function getClientIP(request: NextRequest): string {
    // Vercel
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    // Cloudflare
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP;
    }

    // Real IP
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    return 'unknown';
}

/**
 * Rate limit middleware wrapper
 * API route'larında kullanım için
 */
export function withRateLimit(
    handler: (request: NextRequest) => Promise<NextResponse>,
    config?: Partial<RateLimitConfig>
) {
    const finalConfig = { ...defaultConfig, ...config };

    return async (request: NextRequest): Promise<NextResponse> => {
        const ip = getClientIP(request);
        const result = checkRateLimit(ip, finalConfig);

        // Rate limit header'ları
        const headers = {
            'X-RateLimit-Limit': finalConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString()
        };

        if (!result.success) {
            return NextResponse.json(
                {
                    error: 'Çok fazla istek gönderdiniz. Lütfen bekleyin.',
                    retryAfter: Math.ceil(result.resetIn / 1000)
                },
                {
                    status: 429,
                    headers
                }
            );
        }

        // Normal handler'ı çağır
        const response = await handler(request);

        // Header'ları ekle
        Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
        });

        return response;
    };
}

// Belirli endpoint'ler için önceden tanımlı config'ler
export const rateLimitConfigs = {
    // Hassas endpoint'ler - daha sıkı limit
    sensitive: {
        maxRequests: 5,
        windowMs: 60 * 1000 // 1 dakikada 5 istek
    },
    // Normal API endpoint'leri
    standard: {
        maxRequests: 30,
        windowMs: 60 * 1000 // 1 dakikada 30 istek
    },
    // Auth endpoint'leri - brute force koruması
    auth: {
        maxRequests: 5,
        windowMs: 15 * 60 * 1000 // 15 dakikada 5 istek
    }
};

// Periyodik temizlik (memory leak önleme)
// NOT: Production'da Redis TTL kullanılmalı
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 1000); // Her dakika temizle
