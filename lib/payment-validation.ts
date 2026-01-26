import { z } from 'zod';

// ======== PAYMENT API VALIDATION ========
// Input validation için Zod schema'ları

// Disposable email domain listesi
const disposableEmailDomains = [
    'tempmail.com', 'throwaway.email', 'guerrillamail.com', '10minutemail.com',
    'mailinator.com', 'temp-mail.org', 'fakeinbox.com', 'getnada.com',
    'yopmail.com', 'tempail.com', 'mohmal.com', 'maildrop.cc'
];

// Türk telefon numarası regex
const turkishPhoneRegex = /^(0|\+90)?5\d{9}$/;

// Buyer validation schema
export const buyerSchema = z.object({
    name: z.string()
        .min(2, 'Ad en az 2 karakter olmalı')
        .max(50, 'Ad en fazla 50 karakter olabilir')
        .regex(/^[a-zA-ZğüşöçıİĞÜŞÖÇ\s]+$/, 'Ad sadece harf içerebilir'),

    surname: z.string()
        .min(2, 'Soyad en az 2 karakter olmalı')
        .max(50, 'Soyad en fazla 50 karakter olabilir')
        .regex(/^[a-zA-ZğüşöçıİĞÜŞÖÇ\s]+$/, 'Soyad sadece harf içerebilir'),

    email: z.string()
        .email('Geçerli bir e-posta adresi girin')
        .refine((email) => {
            const domain = email.split('@')[1]?.toLowerCase();
            return !disposableEmailDomains.includes(domain);
        }, 'Geçici e-posta adresleri kabul edilmiyor'),

    phone: z.string()
        .transform(val => val.replace(/[^0-9+]/g, '')) // Sadece rakam ve + bırak
        .refine((val) => turkishPhoneRegex.test(val), 'Geçerli bir telefon numarası girin (05XX XXX XX XX)'),
});

// Payment request validation schema
export const paymentRequestSchema = z.object({
    slug: z.string()
        .min(1, 'Ürün slug\'ı zorunlu')
        .max(100, 'Slug çok uzun')
        .regex(/^[a-z0-9-]+$/, 'Geçersiz slug formatı'),

    buyer: buyerSchema,

    // Opsiyonel alanlar
    packageId: z.string().uuid('Geçersiz paket ID').nullable().optional(),
});

// TC Kimlik validation (Luhn benzeri algoritma)
export const tcKimlikSchema = z.string()
    .length(11, 'TC Kimlik 11 haneli olmalı')
    .regex(/^[1-9]\d{10}$/, 'Geçersiz TC Kimlik formatı')
    .refine((tc) => {
        // TC Kimlik doğrulama algoritması
        const digits = tc.split('').map(Number);

        // İlk 10 hanenin toplamının birler basamağı = 11. hane
        const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
        if (sum10 % 10 !== digits[10]) return false;

        // Tek haneler toplamı * 7 - çift haneler toplamı % 10 = 10. hane
        const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
        const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
        if ((oddSum * 7 - evenSum) % 10 !== digits[9]) return false;

        return true;
    }, 'Geçersiz TC Kimlik numarası');

// XSS payload detection
export function containsXssPayload(text: string): boolean {
    const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+=/i,          // onclick=, onerror=, etc.
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /data:text\/html/i,
        /expression\(/i,
        /vbscript:/i,
    ];

    return xssPatterns.some(pattern => pattern.test(text));
}

// Sanitize helper
export function sanitizeInput(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}

// Validation result type
export type PaymentValidationResult = {
    success: boolean;
    data?: z.infer<typeof paymentRequestSchema>;
    errors?: Record<string, string>;
};

// Validate payment request
export function validatePaymentRequest(body: unknown): PaymentValidationResult {
    const result = paymentRequestSchema.safeParse(body);

    if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach(err => {
            const path = err.path.join('.');
            errors[path] = err.message;
        });
        return { success: false, errors };
    }

    // XSS payload kontrolü
    const { buyer } = result.data;
    if (containsXssPayload(buyer.name) ||
        containsXssPayload(buyer.surname) ||
        containsXssPayload(buyer.email)) {
        return {
            success: false,
            errors: { general: 'Geçersiz karakterler tespit edildi' }
        };
    }

    return { success: true, data: result.data };
}
