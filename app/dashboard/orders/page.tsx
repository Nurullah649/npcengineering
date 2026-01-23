'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Loader2, Receipt, FileText } from 'lucide-react'

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

type Order = {
    id: string
    created_at: string
    status: string
    amount: number
    products: {
        name: string
        slug: string
    } | null
}

export default function OrdersPage() {
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])

    useEffect(() => {
        const fetchOrders = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('orders')
                .select('*, products(name, slug)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (data) {
                setOrders(data as any)
            }
            setLoading(false)
        }
        fetchOrders()
    }, [])

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
                                    <TableHead className="text-right">Fatura</TableHead>
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
                                            <Button variant="ghost" size="sm" disabled>
                                                <FileText className="h-4 w-4" />
                                            </Button>
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
