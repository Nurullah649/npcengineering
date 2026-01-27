'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MediaUpload } from '@/components/admin/media-upload'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
    name: z.string().min(2, 'Ürün adı en az 2 karakter olmalı'),
    slug: z.string().min(2, 'Slug gerekli'),
    description: z.string().min(10, 'Açıklama en az 10 karakter olmalı'),
    short_description: z.string().optional(),
    price: z.coerce.number().min(1, 'Fiyat 1 TL veya üzeri olmalı'),
    original_price: z.coerce.number().optional(),
    category: z.string().min(2, 'Kategori gerekli'),
    features: z.string().optional(),
    tech_stack: z.string().optional(),
    version: z.string().optional(),
    screenshots: z.array(z.string()).optional(),
    video_url: z.string().optional().nullable(),
})

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const productId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            slug: '',
            description: '',
            short_description: '',
            price: 0,
            original_price: 0,
            category: '',
            features: '',
            tech_stack: '',
            version: '',
            screenshots: [],
            video_url: '',
        },
    })

    useEffect(() => {
        const fetchProduct = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single()

            if (error || !data) {
                toast.error('Ürün bulunamadı')
                router.push('/admin/products')
                return
            }

            form.reset({
                name: data.name || '',
                slug: data.slug || '',
                description: data.description || '',
                short_description: data.short_description || '',
                price: data.price || 0,
                original_price: data.original_price || 0,
                category: data.category || '',
                features: data.features?.join('\n') || '',
                tech_stack: data.tech_stack?.join(', ') || '',
                version: data.version || '',
                screenshots: data.screenshots || [],
                video_url: data.video_url || '',
            })

            setLoading(false)
        }
        fetchProduct()
    }, [productId, form, router])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('products')
                .update({
                    name: values.name,
                    slug: values.slug,
                    description: values.description,
                    short_description: values.short_description || null,
                    price: values.price,
                    original_price: values.original_price || null,
                    category: values.category,
                    features: values.features ? values.features.split('\n').filter(f => f.trim()) : [],
                    tech_stack: values.tech_stack ? values.tech_stack.split(',').map(t => t.trim()).filter(t => t) : [],
                    version: values.version || null,
                    screenshots: values.screenshots,
                    video_url: values.video_url || null,
                    last_updated: new Date().toISOString(),
                })
                .eq('id', productId)

            if (error) throw error

            toast.success('Ürün başarıyla güncellendi!')
            router.push('/admin/products')
        } catch (error: any) {
            toast.error(error.message || 'Ürün güncellenirken bir hata oluştu')
        } finally {
            setSaving(false)
        }
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
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/products">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ürün Düzenle</h1>
                    <p className="text-muted-foreground">Ürün bilgilerini güncelleyin</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ürün Bilgileri</CardTitle>
                    <CardDescription>Ürün detaylarını düzenleyin</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ürün Adı</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Slug (URL)</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="short_description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kısa Açıklama</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Açıklama</FormLabel>
                                        <FormControl>
                                            <Textarea className="min-h-32" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 md:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fiyat (₺)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="original_price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Eski Fiyat (₺)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kategori</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="features"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Özellikler (her satıra bir özellik)</FormLabel>
                                        <FormControl>
                                            <Textarea className="min-h-24" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="tech_stack"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teknolojiler (virgülle ayır)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Lua, JavaScript, MySQL" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="version"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Versiyon</FormLabel>
                                            <FormControl>
                                                <Input placeholder="1.0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Medya Yönetimi */}
                            <Card className="border-dashed">
                                <CardHeader>
                                    <CardTitle className="text-lg">Medya Yönetimi</CardTitle>
                                    <CardDescription>
                                        Ürün fotoğrafları ve tanıtım videosu
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <MediaUpload
                                        initialScreenshots={form.watch('screenshots')}
                                        initialVideoUrl={form.watch('video_url')}
                                        onScreenshotsChange={(urls) => form.setValue('screenshots', urls)}
                                        onVideoUrlChange={(url) => form.setValue('video_url', url)}
                                    />
                                </CardContent>
                            </Card>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Güncelle
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/admin/products">İptal</Link>
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
