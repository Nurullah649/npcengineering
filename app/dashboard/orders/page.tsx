'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Loader2, Receipt, FileText, ExternalLink } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

// ======== TYPE SAFETY FIX ========
// Proper type tanımı - as any kullanımı kaldırıldı
interface OrderProduct {
    name: string
    slug: string
}

interface Order {
    id: string
    created_at: string
    status: string
    amount: number
    products: OrderProduct | null
}

// Type guard fonksiyonu
function isValidOrder(data: unknown): data is Order {
    if (typeof data !== 'object' || data === null) return false
    const obj = data as Record<string, unknown>
    return (
        typeof obj.id === 'string' &&
        typeof obj.created_at === 'string' &&
        typeof obj.status === 'string' &&
        typeof obj.amount === 'number'
    )
}
// ================================

export default function OrdersPage() {
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])

    // ======== RACE CONDITION & MEMORY LEAK FIX ========
    // Cleanup flag - component unmount kontrolü
    const mountedRef = useRef(true)
    // Son fetch zamanı - gereksiz refetch önleme
    const lastFetchRef = useRef<number>(0)
    const STALE_TIME = 30000 // 30 saniye

    // useCallback ile stable reference
    const fetchOrders = useCallback(async (force = false) => {
        // Stale time kontrolü - gereksiz refetch önleme
        const now = Date.now()
        if (!force && now - lastFetchRef.current < STALE_TIME) {
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Component unmount olduysa state güncelleme
        if (!mountedRef.current) return

        const { data, error } = await supabase
            .from('orders')
            .select('id, created_at, status, amount, products(name, slug)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        // Component hala mount durumda mı kontrol et
        if (!mountedRef.current) return

        if (error) {
            console.error('[Orders] Fetch error:', error)
            setLoading(false)
            return
        }

        if (data) {
            // Type-safe dönüşüm - Supabase'den products array olarak gelebilir
            const validOrders: Order[] = data.map(item => ({
                id: item.id,
                created_at: item.created_at,
                status: item.status,
                amount: item.amount,
                // products array olarak gelirse ilk elemanı al, değilse olduğu gibi kullan
                products: Array.isArray(item.products)
                    ? (item.products[0] || null)
                    : (item.products || null)
            }))
            setOrders(validOrders)
            lastFetchRef.current = now
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        mountedRef.current = true
        fetchOrders(true) // İlk yüklemede force fetch

        // Sayfa focus'a geldiğinde verileri yenile (stable reference ile)
        const handleFocus = () => {
            if (mountedRef.current) {
                fetchOrders(false) // Stale time kontrolü uygula
            }
        }

        window.addEventListener('focus', handleFocus)

        // Cleanup - memory leak önleme
        return () => {
            mountedRef.current = false
            window.removeEventListener('focus', handleFocus)
        }
    }, [fetchOrders])
    // ================================================

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Siparişlerim</h1>
                <p className="text-muted-foreground">
                    Tüm sipariş geçmişinizi buradan görüntüleyebilirsiniz.
                </p>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Henüz siparişiniz yok</h3>
                        <p className="text-sm text-muted-foreground">
                            İlk siparişinizi verdikten sonra burada görünecektir.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Sipariş Geçmişi</CardTitle>
                        <CardDescription>Toplam {orders.length} sipariş</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sipariş No</TableHead>
                                    <TableHead>Ürün</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Tutar</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">
                                            {order.id.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell>{order.products?.name || 'Ürün'}</TableCell>
                                        <TableCell>
                                            {format(new Date(order.created_at), 'd MMM yyyy', { locale: tr })}
                                        </TableCell>
                                        <TableCell>{order.amount} ₺</TableCell>
                                        <TableCell>
                                            <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                                                {order.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {order.products?.slug === 'siparisgo' && order.status === 'paid' ? (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/onboarding/siparisgo?order_id=${order.id}`}>
                                                        Kuruluma Git
                                                        <ExternalLink className="ml-1 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" disabled>
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
