'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Package, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type PurchasedProduct = {
    id: string
    name: string
    slug: string
    category: string
    order_date: string
    status: string
}

export default function ProductsPage() {
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<PurchasedProduct[]>([])

    useEffect(() => {
        const fetchProducts = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Kullanıcının satın aldığı ürünleri getir
            const { data, error } = await supabase
                .from('orders')
                .select('id, created_at, status, products(name, slug, category)')
                .eq('user_id', user.id)
                .eq('status', 'paid')
                .order('created_at', { ascending: false })

            if (data) {
                const mapped = data.map((order: any) => ({
                    id: order.id,
                    name: order.products?.name || 'Ürün',
                    slug: order.products?.slug || '',
                    category: order.products?.category || '',
                    order_date: order.created_at,
                    status: order.status,
                }))
                setProducts(mapped)
            }

            setLoading(false)
        }
        fetchProducts()
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
                <h1 className="text-2xl font-bold tracking-tight">Ürünlerim</h1>
                <p className="text-muted-foreground">
                    Satın aldığınız tüm ürünlere buradan erişebilirsiniz.
                </p>
            </div>

            {products.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Henüz ürün satın almadınız</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Ürünlerimize göz atarak başlayabilirsiniz.
                        </p>
                        <Button asChild>
                            <Link href="/#products">Ürünlere Göz At</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((product) => (
                        <Card key={product.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{product.name}</CardTitle>
                                        <CardDescription>{product.category}</CardDescription>
                                    </div>
                                    <Badge>Satın Alındı</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex gap-2">
                                    <Button className="flex-1" asChild>
                                        <Link href={`/products/${product.slug}`}>
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Görüntüle
                                        </Link>
                                    </Button>
                                    <Button variant="outline" disabled>
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    İndirme linki yakında eklenecek
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
