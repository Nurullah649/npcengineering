'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, KeyRound, Save } from 'lucide-react'
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
    currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
    newPassword: z.string()
        .min(8, 'Şifre en az 8 karakter olmalı')
        .regex(/[A-Z]/, 'En az bir büyük harf içermeli')
        .regex(/[0-9]/, 'En az bir rakam içermeli'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
})

export default function PasswordPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setSaving(true)
        try {
            // Şifreyi güncelle
            const { error } = await supabase.auth.updateUser({
                password: values.newPassword
            })

            if (error) {
                if (error.message.includes('same')) {
                    toast.error('Yeni şifre mevcut şifre ile aynı olamaz.')
                } else {
                    throw error
                }
                return
            }

            toast.success('Şifreniz başarıyla güncellendi!')
            form.reset()
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Şifre güncellenirken bir hata oluştu.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Şifre Değiştir</h1>
                <p className="text-muted-foreground">
                    Hesabınızın şifresini buradan güncelleyebilirsiniz.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        Şifre Güncelleme
                    </CardTitle>
                    <CardDescription>
                        Güvenliğiniz için güçlü bir şifre seçin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mevcut Şifre</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Yeni Şifre</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-xs text-muted-foreground">
                                            En az 8 karakter, bir büyük harf ve bir rakam içermelidir.
                                        </p>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Yeni Şifre Tekrar</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Şifreyi Güncelle
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
