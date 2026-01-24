'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Save, User } from 'lucide-react'
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
    full_name: z.string().min(2, 'Ad Soyad en az 2 karakter olmalı'),
    phone: z.string()
        .refine((val) => {
            if (!val || val.trim() === '') return true // optional
            // Turkish phone format: 05XX XXX XX XX or +90 5XX XXX XX XX
            const cleaned = val.replace(/\s/g, '')
            return /^(0|\+90)?5\d{9}$/.test(cleaned)
        }, { message: 'Geçerli bir telefon numarası girin (05XX XXX XX XX)' })
        .optional(),
})

export default function SettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [email, setEmail] = useState('')

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            full_name: '',
            phone: '',
        },
    })

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError || !user) {
                    toast.error('Oturum bilgisi alınamadı. Lütfen tekrar giriş yapın.')
                    setLoading(false)
                    return
                }

                setEmail(user.email || '')

                // Profil bilgilerini getir
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, phone')
                    .eq('id', user.id)
                    .single()

                if (profileError && profileError.code !== 'PGRST116') {
                    // PGRST116 = row not found, bu normal olabilir
                    console.error('Profile fetch error:', profileError)
                }

                if (profile) {
                    form.reset({
                        full_name: profile.full_name || user.user_metadata?.full_name || '',
                        phone: profile.phone || '',
                    })
                } else {
                    form.reset({
                        full_name: user.user_metadata?.full_name || '',
                        phone: '',
                    })
                }
            } catch (error) {
                console.error('Fetch profile error:', error)
                toast.error('Profil bilgileri yüklenirken bir hata oluştu.')
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.')
                return
            }

            // Profili güncelle
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: values.full_name,
                    phone: values.phone,
                    email: user.email,
                })

            if (error) throw error

            // User metadata'yı da güncelle
            await supabase.auth.updateUser({
                data: { full_name: values.full_name }
            })

            toast.success('Profil başarıyla güncellendi!')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('Profil güncellenirken bir hata oluştu.')
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
                <h1 className="text-2xl font-bold tracking-tight">Profil Ayarları</h1>
                <p className="text-muted-foreground">
                    Kişisel bilgilerinizi buradan düzenleyebilirsiniz.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Kişisel Bilgiler
                    </CardTitle>
                    <CardDescription>
                        Temel profil bilgilerinizi güncelleyin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ad Soyad</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Adınız Soyadınız" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-2">
                                <FormLabel>Email</FormLabel>
                                <Input value={email} disabled className="bg-muted" />
                                <p className="text-xs text-muted-foreground">
                                    Email adresi değiştirilemez.
                                </p>
                            </div>

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefon</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0555 555 55 55" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
