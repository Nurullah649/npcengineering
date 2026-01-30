'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createCafe, linkSiparisGoAccount, checkAndExtendSubscription } from '../actions'
import { toast } from 'sonner'
import { Loader2, Store, User, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, Link as LinkIcon, PlusCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

// Safe redirect helper
const safeRedirect = (url: string | null | undefined) => {
    if (!url) return 'https://siparisgo.npcengineering.com/dashboard';

    // Allow relative paths
    if (url.startsWith('/')) return url;

    // Allow whitelisted domains
    if (url.startsWith('https://siparisgo.npcengineering.com')) return url;

    // Default fallback
    return 'https://siparisgo.npcengineering.com/dashboard';
}

// Loading fallback
function LoadingSpinner() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
}

// Validation Schema
const formSchema = z.object({
    mode: z.enum(['create', 'link']),
    cafeName: z.string().optional(),
    username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalı'),
    password: z.string().min(1, 'Şifre gerekli'),
    confirmPassword: z.string().optional()
}).superRefine((data, ctx) => {
    if (data.mode === 'create') {
        if (!data.cafeName || data.cafeName.trim().length < 3) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Kafe adı en az 3 karakter olmalı',
                path: ['cafeName']
            })
        }
        if (data.password.length < 8) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Şifre en az 8 karakter olmalı',
                path: ['password']
            })
        }
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Şifreler eşleşmiyor',
                path: ['confirmPassword']
            })
        }
    }
})

type FormData = z.infer<typeof formSchema>

// Main content wrapped in Suspense
export default function SiparisgoOnboardingPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <OnboardingContent />
        </Suspense>
    )
}

function OnboardingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const orderId = searchParams.get('order_id')

    const [loading, setLoading] = useState(true)
    const [success, setSuccess] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Form setup
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            mode: 'create',
            cafeName: '',
            username: '',
            password: '',
            confirmPassword: ''
        }
    })

    const { watch, setValue } = form
    const mode = watch('mode')

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login?redirect=/onboarding/siparisgo')
                return
            }

            if (!orderId) {
                setError('Geçersiz sipariş. Lütfen satın alma işlemini tekrar yapın.')
                setLoading(false)
                return
            }

            // 2. CHECK & EXTEND SUBSCRIPTION (Renewal Logic)
            try {
                const result = await checkAndExtendSubscription(orderId)

                if (result.status === 'extended') {
                    setSuccess(true)
                    setSuccessMessage('Aboneliğiniz başarıyla uzatıldı! İşlem tamamlandı.')
                    setRedirectUrl(result.redirectUrl || 'https://siparisgo.npcengineering.com/dashboard')
                    toast.success('Abonelik süreniz uzatıldı.')

                    setTimeout(() => {
                        window.location.href = safeRedirect(result.redirectUrl)
                    }, 3000)

                    setLoading(false)
                    return
                } else if (result.status === 'error') {
                    if (result.message && result.message !== 'Sistem hatası') {
                        setError(result.message)
                        setLoading(false)
                        return
                    }
                }

                setLoading(false)

            } catch (err) {
                console.error('Check extend error:', err)
                setLoading(false)
            }
        }

        checkAuth()
    }, [router, orderId])

    const onSubmit = async (data: FormData) => {
        if (!orderId) {
            toast.error('Sipariş bilgisi bulunamadı')
            return
        }

        try {
            let result: { success: boolean, redirectUrl?: string, message?: string, error?: string } | undefined;

            if (data.mode === 'create') {
                result = await createCafe({
                    cafeName: data.cafeName!,
                    username: data.username,
                    password: data.password,
                    orderId: orderId
                })
            } else {
                result = await linkSiparisGoAccount({
                    username: data.username,
                    password: data.password,
                    orderId: orderId
                })
            }

            if (result && result.success) {
                setSuccess(true)
                setRedirectUrl(result.redirectUrl || 'https://siparisgo.npcengineering.com')
                toast.success(result.message || (data.mode === 'create' ? 'Kafe oluşturuldu!' : 'Hesap bağlandı!'))

                setTimeout(() => {
                    window.location.href = safeRedirect(result?.redirectUrl)
                }, 3000)
            } else {
                toast.error(result?.error || 'Bir hata oluştu')
                form.setError('root', { message: result?.error || 'Hata' })
            }
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Beklenmeyen hata')
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                            <h2 className="text-xl font-semibold">Hata</h2>
                            <p className="text-muted-foreground">{error}</p>
                            <Button onClick={() => router.push('/products/siparisgo')}>
                                Ürün Sayfasına Dön
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <h2 className="text-xl font-semibold">Tebrikler! 🎉</h2>
                            <p className="text-muted-foreground">{successMessage || (mode === 'create' ? 'Kafe hesabınız başarıyla oluşturuldu.' : 'Hesabınız başarıyla bağlandı.')}</p>
                            <div className="mt-2 rounded-lg bg-muted p-4 w-full">
                                <p className="text-sm font-medium">Giriş Bilgileriniz:</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Kullanıcı adı: <strong>{form.getValues('username')}</strong>
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    ⏳ SiparisGO'ya yönlendiriliyorsunuz...
                                </p>
                            </div>
                            <Button
                                className="mt-2"
                                onClick={() => window.location.href = safeRedirect(redirectUrl)}
                            >
                                Hemen Git
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                            <Store className="h-7 w-7 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">SiparisGO Kurulumu</CardTitle>
                    <CardDescription>
                        {mode === 'create' ? 'Yeni kafe hesabı oluşturun' : 'Mevcut SiparisGO hesabınızı bağlayın'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mode Switcher */}
                    <div className="flex bg-muted p-1 rounded-lg mb-6">
                        <button
                            type="button"
                            onClick={() => setValue('mode', 'create')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mode === 'create'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-background/50'
                                }`}
                        >
                            <PlusCircle className="h-4 w-4" />
                            Yeni Hesap
                        </button>
                        <button
                            type="button"
                            onClick={() => setValue('mode', 'link')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mode === 'link'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-background/50'
                                }`}
                        >
                            <LinkIcon className="h-4 w-4" />
                            Hesap Bağla
                        </button>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Genel Hata Mesajı */}
                            {form.formState.errors.root && (
                                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {form.formState.errors.root.message}
                                </div>
                            )}

                            {/* Cafe Name (Only Create) */}
                            {mode === 'create' && (
                                <FormField
                                    control={form.control}
                                    name="cafeName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kafe / Restoran Adı</FormLabel>
                                            <div className="relative">
                                                <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <FormControl>
                                                    <Input className="pl-10" placeholder="Örn: Güzel Kafe" {...field} />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Username */}
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kullanıcı Adı</FormLabel>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <FormControl>
                                                <Input className="pl-10" placeholder="ornek_kafe" {...field} />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                        <p className="text-xs text-muted-foreground">
                                            SiparisGO'ya giriş yaparken kullandığınız kullanıcı adı
                                        </p>
                                    </FormItem>
                                )}
                            />

                            {/* Password */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Şifre</FormLabel>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <FormControl>
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="pl-10 pr-10"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full w-9 px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                <span className="sr-only">{showPassword ? "Gizle" : "Göster"}</span>
                                            </Button>
                                        </div>
                                        <FormMessage />
                                        {mode === 'create' && (
                                            <p className="text-xs text-muted-foreground">
                                                En az 8 karakter, bir büyük harf ve bir rakam
                                            </p>
                                        )}
                                    </FormItem>
                                )}
                            />

                            {/* Confirm Password (Only Create) */}
                            {mode === 'create' && (
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Şifre Tekrar</FormLabel>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <FormControl>
                                                    <Input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        placeholder="••••••••"
                                                        className="pl-10 pr-10"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-0 top-0 h-full w-9 px-3 py-2 hover:bg-transparent"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    <span className="sr-only">{showConfirmPassword ? "Gizle" : "Göster"}</span>
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {mode === 'create' ? 'Oluşturuluyor...' : 'Bağlanıyor...'}
                                    </>
                                ) : (
                                    mode === 'create' ? 'Kafe Hesabını Oluştur' : 'Hesabı Bağla'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
