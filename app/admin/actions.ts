'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Server-side Supabase client oluştur
async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options as any)
                        )
                    } catch {
                        // Server Component'tan çağrılırsa ignore
                    }
                },
            },
        }
    )
}

// Admin kontrolü - internal helper
async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Oturum açmanız gerekiyor')
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (error || profile?.role !== 'admin') {
        throw new Error('Bu işlem için admin yetkisi gerekiyor')
    }

    return user
}

// Kullanıcı rolünü değiştir
export async function updateUserRole(userId: string, newRole: 'admin' | 'user') {
    const supabase = await createClient()
    const currentUser = await requireAdmin(supabase)

    // Son admin kontrolü - admin kendini user yapıyorsa
    if (newRole === 'user') {
        const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'admin')

        if (countError) {
            throw new Error('Admin sayısı kontrol edilemedi')
        }

        if (count === 1 && userId === currentUser.id) {
            throw new Error('Son admin rolünü kaldıramazsınız. Önce başka bir admin atayın.')
        }
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            role: newRole,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)

    if (error) {
        console.error('Role update error:', error)
        throw new Error('Rol güncellenemedi: ' + error.message)
    }

    revalidatePath('/admin/users')
    return { success: true, message: `Rol başarıyla "${newRole}" olarak güncellendi` }
}

// Sipariş durumunu güncelle
export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = await createClient()
    await requireAdmin(supabase)

    // Status validation
    const validStatuses = ['pending', 'paid', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
        throw new Error('Geçersiz sipariş durumu')
    }

    const { error } = await supabase
        .from('orders')
        .update({
            status,
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

    if (error) {
        console.error('Order status update error:', error)
        throw new Error('Sipariş durumu güncellenemedi: ' + error.message)
    }

    revalidatePath('/admin/orders')
    return { success: true, message: 'Sipariş durumu güncellendi' }
}

// Admin istatistiklerini getir
export async function getAdminStats() {
    const supabase = await createClient()
    await requireAdmin(supabase)

    const [productsResult, ordersResult, usersResult] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('amount, status'),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
    ])

    const totalRevenue = ordersResult.data
        ?.filter(o => o.status === 'paid')
        ?.reduce((acc, o) => acc + (o.amount || 0), 0) || 0

    return {
        totalProducts: productsResult.count || 0,
        totalOrders: ordersResult.data?.length || 0,
        totalUsers: usersResult.count || 0,
        totalRevenue
    }
}

import { invalidateCache } from '@/lib/cache-utils'

// Cache invalidation action
export async function revalidateProductCache(tag: string = 'packages') {
    const supabase = await createClient()
    await requireAdmin(supabase)

    await invalidateCache(tag)
    return { success: true, message: 'Önbellek temizlendi' }
}
