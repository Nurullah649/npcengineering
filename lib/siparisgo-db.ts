import { createClient } from '@supabase/supabase-js'

/**
 * SiparisGO Supabase Client (Server-side only!)
 * 
 * Bu client SiparisGO veritabanına bağlanır - cafes tablosuna yazma için kullanılır.
 * Service role key kullandığı için SADECE server-side'da kullanılmalıdır!
 */

const siparisgoUrl = process.env.SIPARISGO_SUPABASE_URL
const siparisgoServiceKey = process.env.SIPARISGO_SUPABASE_SERVICE_KEY

if (!siparisgoUrl || !siparisgoServiceKey) {
    console.warn('SiparisGO Supabase credentials not configured')
}

// Service role client - bypasses RLS
export const siparisgoDb = siparisgoUrl && siparisgoServiceKey
    ? createClient(siparisgoUrl, siparisgoServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null

/**
 * Slug oluştur (URL-safe)
 * "Güzel Kafe & Restaurant" -> "guzel-kafe-restaurant"
 */
export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        // Turkish characters
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        // Replace spaces and special chars with dash
        .replace(/[^a-z0-9]+/g, '-')
        // Remove leading/trailing dashes
        .replace(/^-+|-+$/g, '')
}

/**
 * Benzersiz slug oluştur
 */
export async function generateUniqueSlug(baseName: string): Promise<string> {
    if (!siparisgoDb) throw new Error('SiparisGO database not configured')

    let slug = generateSlug(baseName)
    let counter = 0

    while (true) {
        const testSlug = counter === 0 ? slug : `${slug}-${counter}`

        const { data } = await siparisgoDb
            .from('cafes')
            .select('id')
            .eq('slug', testSlug)
            .single()

        if (!data) {
            return testSlug
        }

        counter++
        if (counter > 100) {
            throw new Error('Could not generate unique slug')
        }
    }
}
