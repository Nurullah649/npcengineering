'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { SingleImageUpload } from '@/components/admin/single-image-upload'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { revalidateProductCache } from '@/app/admin/actions'

const formSchema = z.object({
    name: z.string().min(2, 'Ürün adı en az 2 karakter olmalı'),
    slug: z.string().min(2, 'Slug gerekli').regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
    description: z.string().min(10, 'Açıklama en az 10 karakter olmalı'),
    short_description: z.string().optional(),
    price: z.coerce.number().min(1, 'Fiyat 1 TL veya üzeri olmalı'),
    original_price: z.coerce.number().optional(),
    cover_image: z.string().optional(),
    category: z.string().min(2, 'Kategori gerekli'),
    features: z.string().optional(),
    tech_stack: z.string().optional(),
    version: z.string().optional(),
    screenshots: z.array(z.string()).optional(),
    video_urls: z.array(z.string()).optional(),
})

export default function NewProductPage() {
    const router = useRouter()
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
            cover_image: '',
            category: '',
            features: '',
            tech_stack: '',
            version: '1.0',
            screenshots: [],
            video_urls: [],
        },
    })

    // Otomatik slug oluştur
    const handleNameChange = (name: string) => {
        const slug = name
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        form.setValue('slug', slug)
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('products')
                .insert({
                    name: values.name,
                    slug: values.slug,
                    description: values.description,
                    short_description: values.short_description || null,
                    price: values.price,
                    original_price: values.original_price || null,
                    cover_image: values.cover_image || null,
                    category: values.category,
                    features: values.features ? values.features.split('\n').filter(f => f.trim()) : [],
                    tech_stack: values.tech_stack ? values.tech_stack.split(',').map(t => t.trim()).filter(t => t) : [],
                    version: values.version || null,
                    screenshots: values.screenshots,
                    video_urls: values.video_urls || [],
                    last_updated: new Date().toISOString(),
                })

            if (error) throw error

            await revalidateProductCache('packages') // Cache invalidation
            toast.success('Ürün başarıyla eklendi!')
            router.push('/admin/products')
        } catch (error: any) {
            toast.error(error.message || 'Ürün eklenirken bir hata oluştu')
        } finally {
            setSaving(false)
        }
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
                    <h1 className="text-2xl font-bold tracking-tight">Yeni Ürün Ekle</h1>
                    <p className="text-muted-foreground">Ürün bilgilerini doldurun</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ürün Bilgileri</CardTitle>
                    <CardDescription>Temel ürün bilgilerini girin</CardDescription>
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
                                                <Input
                                                    placeholder="Örn: FiveM Script Pack"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e)
                                                        handleNameChange(e.target.value)
                                                    }}
                                                />
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
                                                <Input placeholder="fivem-script-pack" {...field} />
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
                                            <Input placeholder="Ürünün kısa tanımı" {...field} />
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
                                            <Textarea
                                                placeholder="Detaylı ürün açıklaması..."
                                                className="min-h-32"
                                                {...field}
                                            />
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
                                                <Input type="number" placeholder="199" {...field} />
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
                                                <Input type="number" placeholder="299" {...field} />
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
                                                <Input placeholder="FiveM" {...field} />
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
                                            <Textarea
                                                placeholder="Özellik 1&#10;Özellik 2&#10;Özellik 3"
                                                className="min-h-24"
                                                {...field}
                                            />
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
                                <CardContent className="space-y-6">
                                    <SingleImageUpload
                                        label="Kapak Görseli (Liste sayfaları için)"
                                        value={form.watch('cover_image')}
                                        onChange={(url) => form.setValue('cover_image', url)}
                                    />

                                    <div className="border-t pt-4"></div>

                                    <MediaUpload
                                        initialScreenshots={form.watch('screenshots')}
                                        initialVideoUrls={form.watch('video_urls')}
                                        onScreenshotsChange={(urls) => form.setValue('screenshots', urls)}
                                        onVideoUrlsChange={(urls) => form.setValue('video_urls', urls)}
                                    />
                                </CardContent>
                            </Card>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Kaydet
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
