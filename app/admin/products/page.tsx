'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type Product = {
    id: string
    name: string
    slug: string
    price: number
    category: string
    last_updated: string
}

export default function AdminProductsPage() {
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<Product[]>([])

    const fetchProducts = async () => {
        const { data } = await supabase
            .from('products')
            .select('id, name, slug, price, category, last_updated')
            .order('last_updated', { ascending: false })

        if (data) {
            setProducts(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const handleDelete = async (id: string, name: string) => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('Ürün silinemedi: ' + error.message)
            return
        }

        toast.success(`"${name}" silindi`)
        fetchProducts()
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ürün Yönetimi</h1>
                    <p className="text-muted-foreground">
                        Toplam {products.length} ürün
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/products/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Ürün
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ürünler</CardTitle>
                </CardHeader>
                <CardContent>
                    {products.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Henüz ürün eklenmemiş.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ürün Adı</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Fiyat</TableHead>
                                    <TableHead className="text-right">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-xs text-muted-foreground">{product.slug}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{product.category}</Badge>
                                        </TableCell>
                                        <TableCell>{product.price} ₺</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/products/${product.slug}`} target="_blank">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/admin/products/${product.id}`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                "{product.name}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(product.id, product.name)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Sil
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
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
