'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createCafe } from '../actions'
import { toast } from 'sonner'
import { Loader2, Store, User, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Loading fallback
function LoadingSpinner() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
}

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
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        cafeName: '',
        username: '',
        password: '',
        confirmPassword: ''
    })

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Validation state
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login?redirect=/onboarding/siparisgo')
                return
            }

            if (!orderId) {
                setError('Geçersiz sipariş. Lütfen satın alma işlemini tekrar yapın.')
            }

            setLoading(false)
        }

        checkAuth()
    }, [router, orderId])

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        // Cafe name
        if (formData.cafeName.trim().length < 3) {
            newErrors.cafeName = 'Kafe adı en az 3 karakter olmalı'
        } else if (formData.cafeName.length > 50) {
            newErrors.cafeName = 'Kafe adı en fazla 50 karakter olabilir'
        }

        // Username
        if (formData.username.length < 3) {
            newErrors.username = 'Kullanıcı adı en az 3 karakter olmalı'
        } else if (formData.username.length > 20) {
            newErrors.username = 'Kullanıcı adı en fazla 20 karakter olabilir'
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'
        }

        // Password
        if (formData.password.length < 8) {
            newErrors.password = 'Şifre en az 8 karakter olmalı'
        } else if (!/[A-Z]/.test(formData.password)) {
            newErrors.password = 'Şifre en az bir büyük harf içermeli'
        } else if (!/[0-9]/.test(formData.password)) {
            newErrors.password = 'Şifre en az bir rakam içermeli'
        }

        // Confirm password
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Şifreler eşleşmiyor'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        if (!orderId) {
            toast.error('Sipariş bilgisi bulunamadı')
            return
        }

        setSubmitting(true)

        try {
            const result = await createCafe({
                cafeName: formData.cafeName,
                username: formData.username,
                password: formData.password,
                orderId: orderId
            })

            if (result.success) {
                setSuccess(true)
                setRedirectUrl(result.redirectUrl || 'https://siparisgo.npcengineering.com')
                toast.success(result.message || 'Kafe başarıyla oluşturuldu!')

                // 3 saniye sonra yönlendir
                setTimeout(() => {
                    if (result.redirectUrl) {
                        window.location.href = result.redirectUrl
                    }
                }, 3000)
            } else {
                toast.error(result.error || 'Bir hata oluştu')
            }
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Beklenmeyen bir hata oluştu')
        } finally {
            setSubmitting(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
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
                            <p className="text-muted-foreground">
                                Kafe hesabınız başarıyla oluşturuldu.
                            </p>
                            <div className="mt-2 rounded-lg bg-muted p-4 w-full">
                                <p className="text-sm font-medium">Giriş Bilgileriniz:</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Kullanıcı adı: <strong>{formData.username}</strong>
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    ⏳ SiparisGO'ya yönlendiriliyorsunuz...
                                </p>
                            </div>
                            <Button
                                className="mt-2"
                                onClick={() => window.location.href = redirectUrl || 'https://siparisgo.npcengineering.com'}
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
                        Kafe veya restoranınız için bilgileri girin
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Cafe Name */}
                        <div className="space-y-2">
                            <Label htmlFor="cafeName">Kafe / Restoran Adı</Label>
                            <div className="relative">
                                <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="cafeName"
                                    name="cafeName"
                                    placeholder="Örn: Güzel Kafe"
                                    className="pl-10"
                                    value={formData.cafeName}
                                    onChange={handleInputChange}
                                    disabled={submitting}
                                />
                            </div>
                            {errors.cafeName && (
                                <p className="text-sm text-destructive">{errors.cafeName}</p>
                            )}
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <Label htmlFor="username">Kullanıcı Adı</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="username"
                                    name="username"
                                    placeholder="ornek_kafe"
                                    className="pl-10"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    disabled={submitting}
                                />
                            </div>
                            {errors.username && (
                                <p className="text-sm text-destructive">{errors.username}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                SiparisGO'ya giriş için kullanacağınız kullanıcı adı
                            </p>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Şifre</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    disabled={submitting}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full w-9 px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="sr-only">{showPassword ? "Gizle" : "Göster"}</span>
                                </Button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                En az 8 karakter, bir büyük harf ve bir rakam
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    disabled={submitting}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full w-9 px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="sr-only">{showConfirmPassword ? "Gizle" : "Göster"}</span>
                                </Button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Oluşturuluyor...
                                </>
                            ) : (
                                'Kafe Hesabını Oluştur'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
