'use server'

import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { siparisgoDb, generateUniqueSlug } from '@/lib/siparisgo-db'
import { redirect } from 'next/navigation'

// Types
interface CafeFormData {
    cafeName: string
    username: string
    password: string
    orderId: string
}

interface ActionResult {
    success: boolean
    message?: string
    error?: string
    redirectUrl?: string
}

// Server-side Supabase client for npcengineering
async function getNpcEngineeringClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options: object }[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options as any)
                        )
                    } catch {
                        // Server Component'tan çağrılırsa sessizce devam et
                    }
                },
            },
        }
    )
}

/**
 * Kafe oluşturma Server Action
 * SiparisGO satın alımı sonrası çağrılır
 */
export async function createCafe(formData: CafeFormData): Promise<ActionResult> {
    try {
        // 1. SiparisGO DB kontrolü
        if (!siparisgoDb) {
            return {
                success: false,
                error: 'Sistem yapılandırması eksik. Lütfen yöneticiyle iletişime geçin.'
            }
        }

        // 2. Mevcut kullanıcıyı doğrula
        const npcClient = await getNpcEngineeringClient()
        const { data: { user }, error: authError } = await npcClient.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.'
            }
        }

        // 3. Order'ı kontrol et (bu kullanıcıya ait mi ve siparisgo mu?)
        const { data: order, error: orderError } = await npcClient
            .from('orders')
            .select('id, user_id, status, products(slug)')
            .eq('shopier_order_id', formData.orderId)
            .single()

        if (orderError || !order) {
            console.error('Order fetch error:', orderError)
            return {
                success: false,
                error: 'Sipariş bulunamadı.'
            }
        }

        if (order.user_id !== user.id) {
            return {
                success: false,
                error: 'Bu siparişe erişim yetkiniz yok.'
            }
        }

        // Ürünün siparisgo olduğunu kontrol et
        const productSlug = (order.products as any)?.slug
        if (productSlug !== 'siparisgo') {
            return {
                success: false,
                error: 'Bu sipariş SiparisGO ürünü için değil.'
            }
        }

        // Order zaten completed ise tekrar kullanılamaz
        if (order.status === 'completed') {
            return {
                success: false,
                error: 'Bu sipariş için kafe kaydı zaten yapılmış.'
            }
        }

        // 4. Username benzersizliğini kontrol et
        const { data: existingCafe } = await siparisgoDb
            .from('cafes')
            .select('id')
            .eq('username', formData.username.toLowerCase())
            .single()

        if (existingCafe) {
            return {
                success: false,
                error: 'Bu kullanıcı adı zaten kullanımda. Lütfen farklı bir kullanıcı adı seçin.'
            }
        }

        // 5. Slug oluştur
        const slug = await generateUniqueSlug(formData.cafeName)

        // 6. Şifreyi hashle (SADECE yorum satırı - SiparisGO düz metin istiyor)
        // const hashedPassword = await bcrypt.hash(formData.password, 12)

        // 7. SiparisGO'da Auth User oluştur (veya mevcut varsa al)
        // Cafes tablosundaki owner_id -> auth.users(id) referansı için gerekli
        let ownerId = user.id

        // ======== INFINITE LOOP / O(n) FIX ========
        // Email ile direkt query - tüm kullanıcıları çekmek yerine
        // Not: Supabase Auth Admin API email filtresi destekliyor
        const { data: { users: existingUsers }, error: listError } = await siparisgoDb.auth.admin.listUsers({
            page: 1,
            perPage: 1,
        })

        // Tüm kullanıcıları çekmek yerine profiles tablosundan kontrol et
        const { data: existingProfile } = await siparisgoDb
            .from('profiles')
            .select('id')
            .eq('email', user.email)
            .maybeSingle()

        const existingSiparisUser = existingProfile ? { id: existingProfile.id } : null
        // ==========================================

        if (existingSiparisUser) {
            ownerId = existingSiparisUser.id
        } else {
            // Yeni kullanıcı oluştur
            const { data: newUser, error: createUserError } = await siparisgoDb.auth.admin.createUser({
                email: user.email!, // NPC Engineering'deki emailini kullanıyoruz
                password: formData.password,
                email_confirm: true,
                user_metadata: {
                    full_name: formData.cafeName,
                    username: formData.username
                }
            })

            if (createUserError || !newUser.user) {
                console.error('SiparisGO auth user creation error:', createUserError)
                return {
                    success: false,
                    error: 'SiparisGO kullanıcı hesabı oluşturulamadı: ' + (createUserError?.message || 'Bilinmeyen hata')
                }
            }
            ownerId = newUser.user.id
        }

        // 8. Abonelik bitiş tarihini hesapla (Dinamik - Pakete göre)
        let durationMonths = 1;

        // Siparişi ve ilişkili paket bilgisini çek
        // (Eğer SQL migration çalıştırıldıysa packages ilişkisi çalışır)
        const { data: orderData } = await npcClient
            .from('orders')
            .select(`
                package_id,
                packages (
                    duration_months
                )
            `)
            .eq('shopier_order_id', formData.orderId)
            .maybeSingle();

        if (!orderData) {
            return {
                success: false,
                error: 'Sipariş bilgisi doğrulanamadı. Lütfen geçerli bir sipariş numarası ile tekrar deneyin.'
            }
        }

        // TypeScript için güvenli erişim (join sonucu tek obje veya array olabilir ama single dediğimiz için obje)
        // @ts-ignore - Supabase type generation güncel olmayabilir
        if (orderData?.packages?.duration_months) {
            // @ts-ignore
            durationMonths = orderData.packages.duration_months;
        }

        const subscriptionEndDate = new Date()
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + durationMonths)

        // 9. Cafes tablosuna insert
        // UYARI: SiparisGO sistemi şu anda şifreleri düz metin olarak bekliyor.
        // Güvenlik riski oluşturur ancak sistem gereksinimi bu yönde.
        const { data: newCafe, error: insertError } = await siparisgoDb
            .from('cafes')
            .insert({
                name: formData.cafeName.trim(),
                slug: slug,
                owner_id: ownerId, // SiparisGO Auth ID'sini kullanıyoruz
                username: formData.username.toLowerCase().trim(),
                password: formData.password, // Düz metin olarak saklıyoruz (SiparisGO gereksinimi)
                role: 'admin',
                is_active: true,
                subscription_end_date: subscriptionEndDate.toISOString(),
                subscription_type: 'monthly',
                auto_renew: false,
                is_frozen: false
            })
            .select('id, slug')
            .single()

        if (insertError) {
            console.error('Cafe insert error:', insertError)
            return {
                success: false,
                error: 'Kafe oluşturulurken bir hata oluştu: ' + insertError.message
            }
        }

        // 9. Order'ı completed olarak güncelle ve order id'yi al
        const { data: updatedOrder } = await npcClient
            .from('orders')
            .update({
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('shopier_order_id', formData.orderId)
            .select('id, product_id')
            .maybeSingle()

        // 10. NPC Engineering subscriptions tablosuna kayıt ekle
        // Bu sayede aboneliklerim sayfasında görünecek
        if (updatedOrder) {
            const { data: newSub } = await npcClient
                .from('subscriptions')
                .insert({
                    user_id: user.id,
                    product_id: updatedOrder.product_id,
                    order_id: updatedOrder.id,
                    start_date: new Date().toISOString(),
                    end_date: subscriptionEndDate.toISOString(),
                    status: 'active',
                    onboarding_status: 'completed'
                })
                .select('id')
                .single()

            // 11. Kullanıcı hesap bilgilerini sakla (Aboneliklerim sayfasında göstermek için)
            if (newSub) {
                await npcClient
                    .from('user_product_accounts')
                    .insert({
                        subscription_id: newSub.id,
                        user_id: user.id,
                        product_id: updatedOrder.product_id,
                        username: formData.username.toLowerCase(),
                        password_encrypted: Buffer.from(formData.password).toString('base64'), // Basit encoding
                        additional_info: {
                            password_set: true,
                            panel_url: 'https://siparisgo.npcengineering.com/login' // Panel giriş linki
                        }
                    })
            }
        }

        // 12. Başarılı - redirect URL döndür
        return {
            success: true,
            message: 'Kafe başarıyla oluşturuldu!',
            redirectUrl: `https://siparisgo.npcengineering.com/login`
        }

    } catch (error) {
        console.error('CreateCafe error:', error)
        return {
            success: false,
            error: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
        }
    }
}
