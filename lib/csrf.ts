import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// CSRF Token secret - env'den alınmalı
const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-this';

/**
 * Basit ve güvenli CSRF token oluştur
 * Double Submit Cookie pattern kullanır
 */
export async function generateCsrfToken(): Promise<string> {
    // Crypto API ile random token oluştur
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

    // Cookie'ye kaydet
    const cookieStore = await cookies();
    cookieStore.set('csrf_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60, // 1 saat
        path: '/'
    });

    return token;
}

/**
 * CSRF token'ı doğrula
 * Header'daki token ile cookie'deki token karşılaştırılır
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
    try {
        // Header'dan token al
        const headerToken = request.headers.get('x-csrf-token');
        if (!headerToken) {
            console.warn('[CSRF] Missing token in header');
            return false;
        }

        // Cookie'den token al
        const cookieToken = request.cookies.get('csrf_token')?.value;
        if (!cookieToken) {
            console.warn('[CSRF] Missing token in cookie');
            return false;
        }

        // Constant-time karşılaştırma (timing attack önleme)
        const isValid = timingSafeEqual(headerToken, cookieToken);

        if (!isValid) {
            console.warn('[CSRF] Token mismatch');
        }

        return isValid;
    } catch (error) {
        console.error('[CSRF] Validation error:', error);
        return false;
    }
}

/**
 * Timing-safe string karşılaştırma
 */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

/**
 * CSRF koruması gerektiren API route'ları için wrapper
 */
export function withCsrfProtection(
    handler: (request: NextRequest) => Promise<NextResponse>
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        // GET, HEAD, OPTIONS metodları CSRF koruması gerektirmez
        const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);

        if (!safeMethod) {
            const isValid = await validateCsrfToken(request);

            if (!isValid) {
                return NextResponse.json(
                    { error: 'Invalid CSRF token' },
                    { status: 403 }
                );
            }
        }

        return handler(request);
    };
}

/**
 * CSRF token'ı response header'a ekle (client için)
 */
export async function getCsrfTokenForClient(): Promise<string> {
    const cookieStore = await cookies();
    let token = cookieStore.get('csrf_token')?.value;

    if (!token) {
        token = await generateCsrfToken();
    }

    return token;
}
