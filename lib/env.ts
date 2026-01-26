import { z } from 'zod'

const envSchema = z.object({
    // Supabase (Required - public)
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL geçerli bir URL olmalı'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY zorunludur'),

    // Shopier (Required - server only)
    SHOPIER_API_KEY: z.string().min(1, 'SHOPIER_API_KEY zorunludur'),
    SHOPIER_API_SECRET: z.string().min(1, 'SHOPIER_API_SECRET zorunludur'),

    // SiparisGO (Optional - for cafe onboarding)
    SIPARISGO_SUPABASE_URL: z.string().url().optional(),
    SIPARISGO_SUPABASE_SERVICE_KEY: z.string().optional(),

    // Admin (Optional - but required for subscription updates)
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
})

// Validate environment variables at build/start time
function validateEnv() {
    const parsed = envSchema.safeParse({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SHOPIER_API_KEY: process.env.SHOPIER_API_KEY,
        SHOPIER_API_SECRET: process.env.SHOPIER_API_SECRET,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    })

    if (!parsed.success) {
        console.error('❌ Geçersiz çevre değişkenleri:')
        console.error(parsed.error.flatten().fieldErrors)
        throw new Error('Çevre değişkenleri doğrulaması başarısız')
    }

    return parsed.data
}

export const env = validateEnv()

// Type export for use in other files
export type Env = z.infer<typeof envSchema>
