'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, MapPin, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
    address_line1: z.string().min(5, 'Adres en az 5 karakter olmalı'),
    address_line2: z.string().optional(),
    city: z.string().min(2, 'Şehir gerekli'),
    district: z.string().min(2, 'İlçe gerekli'),
    postal_code: z.string().min(5, 'Posta kodu gerekli'),
    tc_kimlik: z.string().optional(),
})

export default function BillingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            address_line1: '',
            address_line2: '',
            city: '',
            district: '',
            postal_code: '',
            tc_kimlik: '',
        },
    })

    useEffect(() => {
        const fetchBilling = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('address_line1, address_line2, city, district, postal_code, tc_kimlik')
                .eq('id', user.id)
                .single()

            if (profile) {
                form.reset({
                    address_line1: profile.address_line1 || '',
                    address_line2: profile.address_line2 || '',
                    city: profile.city || '',
                    district: profile.district || '',
                    postal_code: profile.postal_code || '',
                    tc_kimlik: profile.tc_kimlik || '',
                })
            }

            setLoading(false)
        }
        fetchBilling()
    }, [form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    address_line1: values.address_line1,
                    address_line2: values.address_line2,
                    city: values.city,
                    district: values.district,
                    postal_code: values.postal_code,
                    tc_kimlik: values.tc_kimlik,
                })

            if (error) throw error

            toast.success('Fatura adresi başarıyla güncellendi!')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('Fatura adresi güncellenirken bir hata oluştu.')
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
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Fatura Adresi</h1>
                <p className="text-muted-foreground">
                    Fatura bilgilerinizi buradan düzenleyebilirsiniz.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Adres Bilgileri
                    </CardTitle>
                    <CardDescription>
                        Siparişleriniz için kullanılacak fatura adresi.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="address_line1"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adres Satırı 1</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Mahalle, Cadde/Sokak, No" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address_line2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adres Satırı 2 (Opsiyonel)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Daire, Kat, vb." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Şehir</FormLabel>
                                            <FormControl>
                                                <Input placeholder="İstanbul" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="district"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>İlçe</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Kadıköy" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="postal_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Posta Kodu</FormLabel>
                                            <FormControl>
                                                <Input placeholder="34000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="tc_kimlik"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>TC Kimlik No (Opsiyonel)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="11111111111" maxLength={11} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Kaydet
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
