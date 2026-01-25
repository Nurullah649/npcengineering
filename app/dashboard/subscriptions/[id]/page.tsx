'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    ArrowLeft,
    Package,
    Calendar,
    Clock,
    CreditCard,
    RefreshCw,
    Settings,
    Eye,
    EyeOff,
    ExternalLink,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

interface Subscription {
    id: string
    user_id: string
    product_id: string
    package_id: string
    order_id: string
    start_date: string
    end_date: string
    status: string
    created_at: string
    remaining_days: number
    total_days: number
    progress_percentage: number
    is_expiring_soon: boolean
    is_expired: boolean
    products: {
        id: string
        name: string
        slug: string
        image_url?: string
    }
    packages: {
        id: string
        name: string
        duration_months: number
        price: number
    }
}

interface UserAccount {
    id: string
    subscription_id: string
    username: string
    password_masked: string
    has_password: boolean
}

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [account, setAccount] = useState<UserAccount | null>(null)
    const [loading, setLoading] = useState(true)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        const init = async () => {
            const { id } = await params
            await fetchSubscription(id)
        }
        init()
    }, [params])

    const fetchSubscription = async (id: string) => {
        try {
            const response = await fetch('/api/subscriptions')
            const data = await response.json()

            if (data.subscriptions) {
                const sub = data.subscriptions.find((s: Subscription) => s.id === id)
                if (sub) {
                    setSubscription(sub)
                    await fetchAccountInfo(id)
                }
            }
        } catch (error) {
            console.error('Abonelik yüklenemedi:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAccountInfo = async (subscriptionId: string) => {
        try {
            const response = await fetch(`/api/user-accounts?subscription_id=${subscriptionId}`)
            const data = await response.json()

            if (data.accounts && data.accounts.length > 0) {
                setAccount(data.accounts[0])
            }
        } catch (error) {
            console.error('Hesap bilgileri yüklenemedi:', error)
        }
    }

    const getStatusBadge = () => {
        if (!subscription) return null

        if (subscription.is_expired) {
            return (
                <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Süresi Doldu
                </Badge>
            )
        }
        if (subscription.is_expiring_soon) {
            return (
                <Badge variant="outline" className="gap-1 bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                    <AlertTriangle className="h-3 w-3" />
                    Süresi Yaklaşıyor
                </Badge>
            )
        }
        return (
            <Badge variant="outline" className="gap-1 bg-green-500/20 text-green-600 border-green-500/30">
                <CheckCircle2 className="h-3 w-3" />
                Aktif
            </Badge>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!subscription) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold mb-4">Abonelik Bulunamadı</h1>
                    <p className="text-muted-foreground mb-6">
                        Bu abonelik mevcut değil veya size ait değil.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard/subscriptions">Aboneliklerime Dön</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/subscriptions">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Abonelik Detayı</h1>
                    <p className="text-muted-foreground">{subscription.products?.name}</p>
                </div>
                {getStatusBadge()}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Ürün Bilgisi */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Ürün Bilgisi</CardTitle>
                                <CardDescription>Satın aldığınız ürün detayları</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Ürün</span>
                            <span className="font-medium">{subscription.products?.name}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Paket</span>
                            <span className="font-medium">{subscription.packages?.name}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Süre</span>
                            <span className="font-medium">{subscription.packages?.duration_months} Ay</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Ödenen Tutar</span>
                            <span className="font-medium">₺{subscription.packages?.price}</span>
                        </div>

                        {subscription.products?.slug && (
                            <Button variant="outline" className="w-full gap-2" asChild>
                                <Link href={`/products/${subscription.products.slug}`}>
                                    <ExternalLink className="h-4 w-4" />
                                    Ürün Sayfasına Git
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Süre Bilgisi */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Üyelik Süresi</CardTitle>
                                <CardDescription>Abonelik süre bilgileri</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Kalan Süre</span>
                                <span className="font-medium">{subscription.remaining_days} gün</span>
                            </div>
                            <Progress value={100 - subscription.progress_percentage} className="h-3" />
                        </div>

                        <Separator />

                        <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Başlangıç
                            </span>
                            <span className="font-medium">
                                {format(new Date(subscription.start_date), 'd MMMM yyyy', { locale: tr })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Bitiş
                            </span>
                            <span className="font-medium">
                                {format(new Date(subscription.end_date), 'd MMMM yyyy', { locale: tr })}
                            </span>
                        </div>

                        {subscription.products?.slug && (
                            <div className="pt-2">
                                <Button className="w-full gap-2" asChild>
                                    <Link href={`/products/${subscription.products.slug}/packages`}>
                                        <RefreshCw className="h-4 w-4" />
                                        Paket Değiştir / Süre Uzat
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Hesap Bilgileri */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Hesap Bilgileri</CardTitle>
                            <CardDescription>Ürüne erişim için kullanacağınız bilgiler</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {account ? (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <p className="text-sm text-muted-foreground mb-1">Kullanıcı Adı</p>
                                    <code className="text-lg font-mono">{account.username}</code>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <p className="text-sm text-muted-foreground mb-1">Şifre</p>
                                    <div className="flex items-center gap-2">
                                        <code className="text-lg font-mono">
                                            {showPassword ? 'gizli-sifre' : '••••••••'}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Bu bilgileri kullanarak ürüne giriş yapabilirsiniz.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                            <AlertTriangle className="h-12 w-12 text-orange-600 mb-2" />
                            <div>
                                <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                                    Hesap Kurulumu Tamamlanmadı
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                                    Satın aldığınız ürünü kullanmaya başlamak için hesap kurulumunu tamamlamanız gerekmektedir.
                                </p>
                            </div>
                            <Button variant="default" size="lg" className="bg-orange-600 hover:bg-orange-700 text-white gap-2 mt-2" asChild>
                                <Link href={`/onboarding/siparisgo?order_id=${subscription.order_id}`}>
                                    <Settings className="h-4 w-4" />
                                    Hemen Kurulum Yap
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
