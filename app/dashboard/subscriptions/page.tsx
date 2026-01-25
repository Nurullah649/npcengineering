'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    CreditCard,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Package,
    RefreshCw,
    Eye,
    EyeOff,
    ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

interface Subscription {
    id: string
    user_id: string
    product_id: string
    package_id: string | null
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
    } | null
    packages: {
        id: string
        name: string
        duration_months: number
        price: number
    } | null
}

interface UserAccount {
    id: string
    subscription_id: string
    username: string
    password_masked: string
    has_password: boolean
    additional_info?: {
        panel_url?: string
    }
}

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [accounts, setAccounts] = useState<Record<string, UserAccount>>({})
    const [loading, setLoading] = useState(true)
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

    useEffect(() => {
        fetchSubscriptions()
    }, [])

    const fetchSubscriptions = async () => {
        try {
            const response = await fetch('/api/subscriptions')
            const data = await response.json()

            if (data.subscriptions) {
                setSubscriptions(data.subscriptions)

                // Her abonelik için hesap bilgilerini getir
                for (const sub of data.subscriptions) {
                    fetchAccountInfo(sub.id)
                }
            }
        } catch (error) {
            console.error('Abonelikler yüklenemedi:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAccountInfo = async (subscriptionId: string) => {
        try {
            const response = await fetch(`/api/user-accounts?subscription_id=${subscriptionId}`)
            const data = await response.json()

            if (data.accounts && data.accounts.length > 0) {
                setAccounts(prev => ({
                    ...prev,
                    [subscriptionId]: data.accounts[0]
                }))
            }
        } catch (error) {
            console.error('Hesap bilgileri yüklenemedi:', error)
        }
    }

    const togglePasswordVisibility = (subscriptionId: string) => {
        setShowPasswords(prev => ({
            ...prev,
            [subscriptionId]: !prev[subscriptionId]
        }))
    }

    const getStatusBadge = (subscription: Subscription) => {
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
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Aboneliklerim</h1>
                    <p className="text-muted-foreground">Aktif aboneliklerinizi ve hesap bilgilerinizi görüntüleyin.</p>
                </div>
                <div className="grid gap-4">
                    {[1, 2].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (subscriptions.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Aboneliklerim</h1>
                    <p className="text-muted-foreground">Aktif aboneliklerinizi ve hesap bilgilerinizi görüntüleyin.</p>
                </div>
                <Card className="flex flex-col items-center justify-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Henüz aboneliğiniz yok</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                        Ürünlerimizi keşfetmek için mağazayı ziyaret edin.
                    </p>
                    <Button className="mt-4" asChild>
                        <a href="/#products">Ürünleri Keşfet</a>
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Aboneliklerim</h1>
                <p className="text-muted-foreground">
                    Aktif aboneliklerinizi ve hesap bilgilerinizi görüntüleyin.
                </p>
            </div>

            <div className="grid gap-4">
                {subscriptions.map((subscription) => {
                    const account = accounts[subscription.id]
                    const showPassword = showPasswords[subscription.id]

                    return (
                        <Card key={subscription.id} className="overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Package className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">
                                                {subscription.products?.name || 'Ürün'}
                                            </CardTitle>
                                            <CardDescription>
                                                {subscription.packages?.name ? `${subscription.packages.name} Paket` : 'Standart Abonelik'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    {getStatusBadge(subscription)}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Süre Bilgisi */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Kalan Süre</span>
                                        <span className="font-medium">
                                            {subscription.remaining_days} gün kaldı
                                        </span>
                                    </div>
                                    <Progress
                                        value={100 - subscription.progress_percentage}
                                        className="h-2"
                                    />
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Başlangıç: {format(new Date(subscription.start_date), 'd MMM yyyy', { locale: tr })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Bitiş: {format(new Date(subscription.end_date), 'd MMM yyyy', { locale: tr })}
                                        </span>
                                    </div>
                                </div>

                                <Separator />

                                {/* Hesap Bilgileri */}
                                {account ? (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium">Hesap Bilgileri</h4>
                                        <div className="grid gap-2 p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Kullanıcı Adı</span>
                                                <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                                                    {account.username}
                                                </code>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Şifre</span>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                                                        {showPassword ? 'gizli-sifre' : '••••••••'}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => togglePasswordVisibility(subscription.id)}
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <Eye className="h-3.5 w-3.5" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                            {/* Panel Linki Varsa Göster */}
                                            {account.additional_info?.panel_url && (
                                                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                                                    <span className="text-sm text-muted-foreground">Yönetim Paneli</span>
                                                    <Button variant="link" size="sm" className="h-auto p-0 text-primary" asChild>
                                                        <a href={account.additional_info.panel_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                            Giriş Yap
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
                                        Hesap bilgileri henüz oluşturulmamış
                                    </div>
                                )}

                                {/* Aksiyonlar */}
                                <div className="flex items-center gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="gap-2" asChild>
                                        <a href={`/dashboard/subscriptions/${subscription.id}`}>
                                            Detaylar
                                        </a>
                                    </Button>
                                    {(subscription.is_expiring_soon || subscription.is_expired) && (
                                        <Button size="sm" className="gap-2" asChild>
                                            <a href={`/products/${subscription.products?.slug || 'siparisgo'}/packages`}>
                                                <RefreshCw className="h-4 w-4" />
                                                {subscription.is_expired ? 'Yenile' : 'Süre Uzat'}
                                            </a>
                                        </Button>
                                    )}
                                    {subscription.products?.slug && (
                                        <Button variant="outline" size="sm" className="gap-2" asChild>
                                            <a href={`/products/${subscription.products.slug}`}>
                                                <ExternalLink className="h-4 w-4" />
                                                Ürüne Git
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
