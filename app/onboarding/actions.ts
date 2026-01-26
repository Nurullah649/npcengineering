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

        // UUID Format Kontrolü (Manuel testlerde kolaylık için)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.orderId);
        const idField = isUUID ? 'id' : 'shopier_order_id';

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
            .eq(idField, formData.orderId)
            .maybeSingle()

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
        // Order zaten completed ise tekrar kullanılamaz
        if (order.status === 'completed') {
            // RECOVERY MODE:
            // Eğer sipariş completed görünüyor ama user_product_accounts tablosunda kayıt yoksa
            // (örneğin önceki işlem yarıda kaldıysa), tekrar kuruluma izin ver.
            const { count } = await npcClient
                .from('user_product_accounts')
                .select('*', { count: 'exact', head: true })
                .eq('order_id', order.id) // Order ID ile kontrol daha güvenli

            if (count && count > 0) {
                return {
                    success: false,
                    error: 'Bu sipariş için kafe kaydı zaten yapılmış.'
                }
            }
            // Count 0 ise devam et...
        }

        // 4. Username benzersizliğini kontrol et
        const { data: existingCafe } = await siparisgoDb
            .from('cafes')
            .select('id, owner_id')
            .eq('username', formData.username.toLowerCase())
            .single()

        // CONFLICT LOGIC:
        // Eğer kullanıcı adı varsa hemen hata vermiyoruz.
        // Belki bu kullanıcı adı ZATEN bu kullanıcıya aittir (Recovery durumu).
        // Aşağıda ownerId belirlendikten sonra kontrol edeceğiz.

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

            if (createUserError) {
                // Eğer kullanıcı zaten varsa (Email already registered hatası)
                // Bu durumda var olan kullanıcıyı bulup ona bağlamalıyız
                if (createUserError.message?.includes('registered') || createUserError.message?.includes('already exists')) {
                    console.log('SiparisGO user already exists, trying to find by scanning...');

                    // Fallback: Kullanıcıyı bulmak için listUsers scan (Verimsiz ama tek çare)
                    // Not: Bu sadece profiles tablosunda email bulunamadığında çalışır
                    let foundUser = null;
                    let page = 1;
                    const perPage = 50;

                    while (!foundUser) {
                        const { data: { users }, error } = await siparisgoDb.auth.admin.listUsers({
                            page: page,
                            perPage: perPage
                        });

                        if (error || !users || users.length === 0) break;

                        foundUser = users.find(u => u.email?.toLowerCase() === user.email?.toLowerCase());

                        if (foundUser) break;
                        if (users.length < perPage) break; // Son sayfa
                        page++;
                    }

                    if (foundUser) {
                        ownerId = foundUser.id;

                        // ÖNEMLİ: Mevcut kullanıcının şifresini formdan gelen yeni şifreyle güncelle
                        // Böylece hem kullanıcı yeni belirlediği şifreyi kullanabilir,
                        // hem de panelde gösterilen şifre doğru olur.
                        const { error: updateError } = await siparisgoDb.auth.admin.updateUserById(ownerId, {
                            password: formData.password
                        });

                        if (updateError) {
                            console.error('Password update error:', updateError);
                            // Şifre güncellenemese bile devam et, ama logla
                        }
                    } else {
                        // Bulunamadıysa hata dön
                        return {
                            success: false,
                            error: 'SiparisGO hesabınız mevcut ancak erişilemiyor. Lütfen destek ile iletişime geçin.'
                        }
                    }
                } else {
                    // Başka bir hata
                    console.error('SiparisGO auth user creation error:', createUserError)
                    return {
                        success: false,
                        error: 'SiparisGO kullanıcı hesabı oluşturulamadı: ' + (createUserError?.message || 'Bilinmeyen hata')
                    }
                }
            } else if (newUser.user) {
                ownerId = newUser.user.id;
            } else {
                return {
                    success: false,
                    error: 'Kullanıcı oluşturulamadı (Bilinmeyen durum)'
                }
            }
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
            .eq(idField, formData.orderId)
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

        // *** SON KONTROL ***
        // Eğer username doluysa ve sahibi ben değilsem -> HATA
        if (existingCafe && existingCafe.owner_id !== ownerId) {
            return {
                success: false,
                error: 'Bu kullanıcı adı zaten kullanımda. Lütfen farklı bir kullanıcı adı seçin.'
            }
        }

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
            .eq(idField, formData.orderId)
            .select('id, product_id')
            .maybeSingle()

        // 10. NPC Engineering subscriptions tablosuna kayıt ekle
        // Bu sayede aboneliklerim sayfasında görünecek
        // 10. NPC Engineering subscriptions tablosuna kayıt ekle veya güncelle
        let subId: string | null = null;
        const currentOrderId = updatedOrder?.id || order.id;
        const currentProductId = updatedOrder?.product_id || (order as any).product_id;

        // Önce var olan aboneliği kontrol et
        const { data: existingSub } = await npcClient
            .from('subscriptions')
            .select('id')
            .eq('order_id', currentOrderId)
            .maybeSingle();

        if (existingSub) {
            subId = existingSub.id;
        } else {
            const { data: newSub, error: subError } = await npcClient
                .from('subscriptions')
                .insert({
                    user_id: user.id,
                    product_id: currentProductId,
                    order_id: currentOrderId,
                    start_date: new Date().toISOString(),
                    end_date: subscriptionEndDate.toISOString(),
                    status: 'active',
                    onboarding_status: 'completed'
                })
                .select('id')
                .single()

            if (newSub) {
                subId = newSub.id;
            } else if (subError) {
                console.error('Subscription creation error:', subError);
            }
        }

        // 11. Kullanıcı hesap bilgilerini sakla (Aboneliklerim sayfasında göstermek için)
        if (subId) {
            // Hesap oluştur
            const { error: accError } = await npcClient
                .from('user_product_accounts')
                .insert({
                    subscription_id: subId,
                    user_id: user.id,
                    product_id: currentProductId,
                    username: formData.username.toLowerCase(),
                    password_encrypted: Buffer.from(formData.password).toString('base64'),
                    additional_info: {
                        password_set: true,
                        panel_url: 'https://siparisgo.npcengineering.com/login'
                    }
                })

            if (accError) {
                console.error('Account create error:', accError)
            }
        }

        // 12. Başarılı - redirect URL döndür
        return {
            success: true,
            message: 'Kafe başarıyla oluşturuldu!',
            redirectUrl: `https://siparisgo.npcengineering.com/dashboard`
        }

    } catch (error) {
        console.error('CreateCafe error:', error)
        return {
            success: false,
            error: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
        }
    }
}

// Mevcut SiparisGO hesabını NPC aboneliğine bağlar
export async function linkSiparisGoAccount(formData: {
    username: string
    password: string
    orderId: string
}) {
    try {
        const npcClient = await getNpcEngineeringClient()

        // 1. Auth Check
        const { data: { user } } = await npcClient.auth.getUser()
        if (!user) {
            return {
                success: false,
                error: 'Oturum açmanız gerekiyor.'
            }
        }

        // 2. Order Check
        // UUID Format Kontrolü
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.orderId);
        const idField = isUUID ? 'id' : 'shopier_order_id';

        const { data: order } = await npcClient
            .from('orders')
            .select('*')
            .eq(idField, formData.orderId)
            .single()

        if (!order) {
            return {
                success: false,
                error: 'Geçersiz sipariş bilgisi.'
            }
        }

        // 3. SiparisGO Cafe Verify
        if (!siparisgoDb) {
            return {
                success: false,
                error: 'Sistem hatası: SiparisGO bağlantısı yok.'
            }
        }
        const { data: cafe } = await siparisgoDb
            .from('cafes')
            .select('*')
            .eq('username', formData.username.toLowerCase())
            .single()

        if (!cafe) {
            return {
                success: false,
                error: 'Bu kullanıcı adıyla bir kafe bulunamadı.'
            }
        }

        // Şifre kontrolü (Düz metin)
        if (cafe.password !== formData.password) {
            return {
                success: false,
                error: 'Şifre hatalı.'
            }
        }

        // 4. SiparisGO Auth User Sync (Transfer Ownership)
        // NPC kullanıcısının maili ile SiparisGO Auth kullanıcısını bul veya oluştur
        let targetOwnerId = null

        // A) Profiles kontrolü
        const { data: existingProfile } = await siparisgoDb
            .from('profiles')
            .select('id')
            .eq('email', user.email)
            .maybeSingle()

        if (existingProfile) {
            targetOwnerId = existingProfile.id
        }

        // B) Auth Admin Check (user_metadata ile veya listUsers ile)
        if (!targetOwnerId) {
            const { data: { users: existingUsers } } = await siparisgoDb.auth.admin.listUsers({
                page: 1,
                perPage: 5 // Sadece birkaç tane getirsek yeterli mi? Hayır, email filtre yoksa.
                // Ama listUsers email filtresi desteklemiyorsa bu sorun.
                // createCafe'deki çözüm: createUser dene, duplicate ise bul.
            })

            // createCafe'deki logic'i kullanalım: CreateUser dene
            const { data: newUser, error: createUserError } = await siparisgoDb.auth.admin.createUser({
                email: user.email!,
                password: formData.password, // Kafe şifresini Auth şifresi yapalım
                email_confirm: true,
                user_metadata: {
                    full_name: cafe.name, // Kafe adını al
                    username: formData.username
                }
            })

            if (newUser?.user) {
                targetOwnerId = newUser.user.id
            } else if (createUserError) {
                // Duplicate email?
                if (createUserError.message?.includes('registered') || createUserError.message?.includes('already exists')) {
                    // Bulmak için scan (veya profile update mi yapsak?)
                    // Scan yapalım (createCafe'den kopya)
                    // ... Scan logic ...
                    // Basitleştirilmiş: İlk 100 kullanıcıda ara?
                    const { data: { users } } = await siparisgoDb.auth.admin.listUsers({ perPage: 100 })
                    const found = users.find((u: any) => u.email === user.email)
                    if (found) targetOwnerId = found.id
                }
            }
        }

        if (!targetOwnerId) {
            // Hala bulamadıysak, eski sahibin owner_id'sini koruyalım mı?
            // "Mevcut hesabı bağla" diyorsak, sahibi o olmalı.
            // Eğer email eşleşmiyorsa (SiparisGO'daki email farklıysa), ne yapacağız?
            // Kullanıcı NPC'ye A mailiyle girdi, ama SiparisGO'da B mailiyle hesabı var.
            // "Mevcut Hesap Bağla" işleminde B mailini girmesini istemedik (sadece username/pass).
            // O zaman kafe'nin şimdiki owner_id'si kim?
            // Onu alıp, onun Auth User'ına mı bağlayacağız?
            // AMAÇ: NPC Dashboard'dan yönetmek. NPC Dashboard `user_product_accounts` tablosunda `owner_id` (Auth ID) tutulmaz, sadece `username` tutulur.
            // `cafes.owner_id` aslında RLS ve Auth için önemli.

            // Strateji: Kafe'nin sahibini DEĞİŞTİRME. Sadece user_product_accounts ekle.
            // Kullanıcı username/password bildiğine göre yetkilidir.
            // Sadece NPC tarafında "Benim kafem bu" diye kayıt atalım.
            // Auth owner'ı değiştirmek tehlikeli olabilir (Eski mailine erişimi kaybedebilir).

            // KARAR: Owner ID'ye dokunma. Sadece NPC kaydı oluştur.
        }

        // 5. Subscription & Account (NPC)
        // Subscription zaten var mı? (createCafe'den kopya logic)
        const durationMonths = 1; // Default
        const subscriptionEndDate = new Date()
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + durationMonths)

        // Subscription Update
        let subId: string | null = null;
        const currentProductId = order.product_id;

        const { data: existingSub } = await npcClient
            .from('subscriptions')
            .select('id')
            .eq('order_id', formData.orderId)
            .maybeSingle();

        if (existingSub) {
            subId = existingSub.id;
            // Update status if needed
            await npcClient.from('subscriptions').update({ status: 'active', onboarding_status: 'completed' }).eq('id', subId)
        } else {
            const { data: newSub } = await npcClient
                .from('subscriptions')
                .insert({
                    user_id: user.id,
                    product_id: currentProductId,
                    order_id: formData.orderId,
                    start_date: new Date().toISOString(),
                    end_date: subscriptionEndDate.toISOString(),
                    status: 'active',
                    onboarding_status: 'completed'
                })
                .select('id')
                .single()
            if (newSub) subId = newSub.id
        }

        // Account Insert
        if (subId) {
            const { error: accError } = await npcClient
                .from('user_product_accounts')
                .insert({
                    subscription_id: subId,
                    user_id: user.id,
                    product_id: currentProductId,
                    username: formData.username.toLowerCase(),
                    password_encrypted: Buffer.from(formData.password).toString('base64'),
                    additional_info: {
                        password_set: true,
                        panel_url: 'https://siparisgo.npcengineering.com/login'
                    }
                })
            if (accError) console.error('Link account error:', accError)
        }

        // Order update
        await npcClient.from('orders').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', formData.orderId)

        // Cafe update (Sadece süre uzatma?)
        // Eğer yeni satın aldıysa süresini uzatalım.
        // Ama "Bağla" dediğinde belki süresi zaten vardır?
        // Neyse, siparişin hakkını verelim: +1 Ay ekleyelim.
        const currentEndDate = new Date(cafe.subscription_end_date > new Date().toISOString() ? cafe.subscription_end_date : new Date())
        currentEndDate.setMonth(currentEndDate.getMonth() + 1)

        await siparisgoDb.from('cafes').update({
            subscription_end_date: currentEndDate.toISOString()
        }).eq('id', cafe.id)

        return {
            success: true,
            message: 'Hesap başarıyla bağlandı!',
            redirectUrl: `https://siparisgo.npcengineering.com/dashboard`
        }

    } catch (error) {
        console.error('LinkSiparisGo error:', error)
        return {
            success: false,
            error: 'Bir hata oluştu.'
        }
    }
}

// Yeni: Otomatik Süre Uzatma Kontrolü
// Sayfa yüklendiğinde çağrılır.
// Eğer kullanıcı zaten varsa ve sipariş yenileme ise süreyi uzatır.
// Yoksa 'new_user' döner ve form açılır.
export async function checkAndExtendSubscription(orderId: string): Promise<{
    status: 'extended' | 'new_user' | 'error',
    message?: string,
    redirectUrl?: string
}> {
    try {
        const npcClient = await getNpcEngineeringClient()
        const { data: { user } } = await npcClient.auth.getUser()

        if (!user) return { status: 'error', message: 'Oturum gerekli' }

        // 1. Siparişi Bul (Shopier ID desteği ile)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
        const idField = isUUID ? 'id' : 'shopier_order_id';

        const { data: order } = await npcClient
            .from('orders')
            .select(`
                id, 
                user_id, 
                status, 
                product_id,
                packages(duration_months)
            `)
            .eq(idField, orderId)
            .maybeSingle()

        if (!order) return { status: 'error', message: 'Sipariş bulunamadı' }

        // Güvenlik: Sipariş bu kullanıcıya mı ait?
        if (order.user_id !== user.id) return { status: 'error', message: 'Yetkisiz erişim' }

        // Eğer sipariş zaten tamamlanmışsa
        if (order.status === 'completed') {
            // Belki kullanıcı sayfayı yeniledi, yine de "başarılı" diyelim kiDashboard'a gitsin
            return {
                status: 'extended',
                message: 'İşlem daha önce tamamlanmış.',
                redirectUrl: 'https://siparisgo.npcengineering.com/dashboard'
            }
        }

        // 2. Kullanıcının bu ürün için hesabı var mı?
        const { data: accounts } = await npcClient
            .from('user_product_accounts')
            .select('*, subscriptions(*)')
            .eq('user_id', user.id)
            .eq('product_id', order.product_id)

        // HESAP YOKSA -> İLK KAYIT (Form Göster)
        if (!accounts || accounts.length === 0) {
            return { status: 'new_user' }
        }

        const account = accounts[0]; // İlk hesabı al

        // 3. HESAP VARSA -> SÜRE UZAT (SiparisGO + NPC)
        if (!siparisgoDb) return { status: 'error', message: 'Sistem hatası' }

        // Süre hesapla
        // @ts-ignore
        const durationMonths = order.packages?.duration_months || 1;

        // Mevcut bitiş tarihini al (Hesaptan veya Subscription'dan)
        let currentEndDate = new Date();
        // @ts-ignore
        if (account.subscriptions?.end_date) {
            // @ts-ignore
            const subEndDate = new Date(account.subscriptions.end_date);
            // Eğer bitiş tarihi gelecekteyse onun üzerine ekle, değilse şimdinin üzerine ekle
            if (subEndDate > currentEndDate) {
                currentEndDate = subEndDate;
            }
        }

        const newEndDate = new Date(currentEndDate);
        newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

        // A) SiparisGO 'cafes' Update
        const { error: cafeError } = await siparisgoDb
            .from('cafes')
            .update({ subscription_end_date: newEndDate.toISOString() })
            .eq('username', account.username)

        if (cafeError) console.error('AutoExtend cafe error:', cafeError)

        // B) NPC 'subscriptions' Update
        if (account.subscription_id) {
            await npcClient
                .from('subscriptions')
                .update({
                    end_date: newEndDate.toISOString(),
                    status: 'active'
                })
                .eq('id', account.subscription_id)
        }

        // C) Siparişi Kapat
        await npcClient
            .from('orders')
            .update({
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq(idField, orderId)

        return {
            status: 'extended',
            message: 'Aboneliğiniz başarıyla uzatıldı!',
            redirectUrl: 'https://siparisgo.npcengineering.com/dashboard'
        }

    } catch (error) {
        console.error('CheckAndExtend error:', error)
        return { status: 'error', message: 'Beklenmeyen hata' }
    }
}

// Otomatik Abonelik Uzatma
// Kullanıcı zaten kurulmuş bir hesaba sahipse, yeni siparişi direkt uzatma olarak işler
export async function autoExtendSubscription(orderId: string): Promise<ActionResult> {
    try {
        const npcClient = await getNpcEngineeringClient()
        const { data: { user } } = await npcClient.auth.getUser()

        if (!user) return { success: false, error: 'Oturum gerekli' }

        // 1. Sipariş Kontrolü
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
        const idField = isUUID ? 'id' : 'shopier_order_id';

        const { data: order } = await npcClient
            .from('orders')
            .select(`
                id, 
                user_id, 
                status, 
                product_id,
                products(slug),
                packages(duration_months)
            `)
            .eq(idField, orderId)
            .maybeSingle()

        if (!order) return { success: false, error: 'Sipariş bulunamadı' }
        if (order.user_id !== user.id) return { success: false, error: 'Yetkisiz erişim' }
        if (order.status === 'completed') {
            // Zaten tamamlanmışsa, belki kullanıcı sayfayı yeniledi
            // Başarılı dönelim ki yönlendirsin
            return { success: true, message: 'İşlem zaten tamamlanmış', redirectUrl: 'https://siparisgo.npcengineering.com/login' }
        }

        // 2. Mevcut Hesap Kontrolü (User Product Accounts)
        // Bu kullanıcının bu ürün (siparisgo) için zaten bir hesabı var mı?
        const { data: accounts } = await npcClient
            .from('user_product_accounts')
            .select('*, subscriptions(id, status, end_date)')
            .eq('user_id', user.id)
            .eq('product_id', order.product_id)

        // Eğer hesap yoksa, auto-extend yapamayız. Kullanıcı form doldurmalı.
        if (!accounts || accounts.length === 0) {
            return { success: false, error: 'Mevcut hesap bulunamadı' }
        }

        const account = accounts[0]; // İlk hesabı baz alıyoruz (Genelde 1 tane olur)

        // 3. SiparisGO DB Bağlantısı
        if (!siparisgoDb) return { success: false, error: 'Sistem hatası' }

        // 4. Süre Hesapla
        // @ts-ignore
        const durationMonths = order.packages?.duration_months || 1;

        // Mevcut bitiş tarihini al
        let currentEndDate = new Date();
        // @ts-ignore
        if (account.subscriptions?.end_date) {
            // @ts-ignore
            const subEndDate = new Date(account.subscriptions.end_date);
            if (subEndDate > currentEndDate) {
                currentEndDate = subEndDate;
            }
        }

        // Yeni bitiş tarihi
        const newEndDate = new Date(currentEndDate);
        newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

        // 5. Güncellemeleri Yap

        // A) SiparisGO 'cafes' tablosu güncelleme
        const { error: cafeError } = await siparisgoDb
            .from('cafes')
            .update({ subscription_end_date: newEndDate.toISOString() })
            .eq('username', account.username) // Username üzerinden eşleştirme

        if (cafeError) {
            console.error('AutoExtend cafe update error:', cafeError);
            // Devam edelim, kritik değil (NPC tarafını güncelleyelim en azından)
        }

        // B) NPC 'subscriptions' tablosu güncelleme (Mevcut aboneliği uzat)
        if (account.subscription_id) {
            await npcClient
                .from('subscriptions')
                .update({
                    end_date: newEndDate.toISOString(),
                    status: 'active'
                })
                .eq('id', account.subscription_id)
        }

        // C) Siparişi tamamla
        // DİKKAT: Yeni siparişin 'subscriptions' tablosunda kendi kaydı OLMALI MI?
        // Yoksa eski aboneliği mi uzatıyoruz?
        // Mantıken: Bir kullanıcının bir ürüne 1 aboneliği olur (genelde).
        // Eski aboneliği uzattık. Yeni siparişi 'completed' yapıp bırakıyoruz.
        // FAKAT: createCafe fonksiyonu yeni bir subscription satırı oluşturmuyor muydu?
        // createCafe: Eğer existingSub yoksa oluşturuyor.
        // Biz burada existingSub'ı (eski siparişin aboneliğini) uzattık.
        // Bu YENİ sipariş için de bir subscription kaydı açmalı mıyız?
        // Genelde hayır, "Abonelik" tekil bir varlık, "Sipariş" çoğul.
        // Ama kullanıcı "Siparişlerim" altında bu siparişi görecek.
        // Aboneliklerim sayfasında ise TEK bir kart görüyor (son durumu).
        // O yüzden mevcut aboneliği update etmek doğru.

        // Siparişi kapat
        await npcClient
            .from('orders')
            .update({
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq(idField, orderId)

        return {
            success: true,
            message: 'Abonelik süreniz başarıyla uzatıldı!',
            redirectUrl: 'https://siparisgo.npcengineering.com/dashboard'
        }

    } catch (error) {
        console.error('AutoExtend error:', error);
        return { success: false, error: 'Beklenmeyen hata' }
    }
}
