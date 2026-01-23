'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type Order = {
    id: string
    created_at: string
    status: string
    amount: number
    profiles: { email: string; full_name: string } | null
    products: { name: string } | null
}

export default function AdminOrdersPage() {
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])

    const fetchOrders = async () => {
        const { data } = await supabase
            .from('orders')
            .select('*, profiles(email, full_name), products(name)')
            .order('created_at', { ascending: false })

        if (data) {
            setOrders(data as any)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId)

        if (error) {
            toast.error('Durum güncellenemedi')
            return
        }

        toast.success('Sipariş durumu güncellendi')
        fetchOrders()
    }

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
                <h1 className="text-2xl font-bold tracking-tight">Sipariş Yönetimi</h1>
                <p className="text-muted-foreground">
                    Toplam {orders.length} sipariş
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Siparişler</CardTitle>
                    <CardDescription>Tüm siparişleri görüntüle ve durumlarını güncelle</CardDescription>
                </CardHeader>
                <CardContent>
                    {orders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Henüz sipariş yok.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sipariş No</TableHead>
                                    <TableHead>Müşteri</TableHead>
                                    <TableHead>Ürün</TableHead>
                                    <TableHead>Tutar</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">
                                            {order.id.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{order.profiles?.full_name || 'İsimsiz'}</div>
                                            <div className="text-xs text-muted-foreground">{order.profiles?.email}</div>
                                        </TableCell>
                                        <TableCell>{order.products?.name || 'Ürün'}</TableCell>
                                        <TableCell>{order.amount} ₺</TableCell>
                                        <TableCell>
                                            {format(new Date(order.created_at), 'd MMM yyyy HH:mm', { locale: tr })}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={order.status}
                                                onValueChange={(value) => handleStatusChange(order.id, value)}
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Bekliyor</SelectItem>
                                                    <SelectItem value="paid">Ödendi</SelectItem>
                                                    <SelectItem value="completed">Tamamlandı</SelectItem>
                                                    <SelectItem value="cancelled">İptal</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
