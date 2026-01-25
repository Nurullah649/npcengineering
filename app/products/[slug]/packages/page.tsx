'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
    ArrowLeft,
    Check,
    Clock,
    Sparkles,
    Loader2,
    Crown,
    Zap,
    Star
} from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Package {
    id: string
    product_id: string
    name: string
    duration_months: number
    price: number
    original_price?: number | null // İndirimsiz fiyat
    discount_percentage: number
    discount_label?: string | null // İndirim etiketi
    is_active: boolean
    monthly_equivalent: number
    savings: number
    products: {
        id: string
        name: string
        slug: string
    }
}

interface Product {
    id: string
    name: string
    slug: string
    price: number
    image_url?: string
    shortDescription?: string
}

export default function PackagesPage({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter()
    const [slug, setSlug] = useState<string>('')
    const [packages, setPackages] = useState<Package[]>([])
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

    useEffect(() => {
        const init = async () => {
            const { slug: slugValue } = await params
            setSlug(slugValue)
            await fetchPackages(slugValue)
        }
        init()
    }, [params])

    const fetchPackages = async (productSlug: string) => {
        try {
            const response = await fetch(`/api/packages?slug=${productSlug}`)
            const data = await response.json()

            if (data.packages && data.packages.length > 0) {
                setPackages(data.packages)
                // Varsayılan olarak en popüler paketi seç (6 ay veya ilk paket)
                const popularPackage = data.packages.find((p: Package) => p.duration_months === 6) || data.packages[0]
                setSelectedPackage(popularPackage.id)

                // Ürün bilgisini al
                if (data.packages[0].products) {
                    setProduct({
                        id: data.packages[0].products.id,
                        name: data.packages[0].products.name,
                        slug: data.packages[0].products.slug,
                        price: data.packages[0].price
                    })
                }
            }
        } catch (error) {
            console.error('Paketler yüklenemedi:', error)
            toast.error('Paket bilgileri yüklenirken bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    const getPackageIcon = (durationMonths: number) => {
        switch (durationMonths) {
            case 1:
                return <Zap className="h-5 w-5" />
            case 3:
                return <Star className="h-5 w-5" />
            case 6:
                return <Sparkles className="h-5 w-5" />
            case 12:
                return <Crown className="h-5 w-5" />
            default:
                return <Clock className="h-5 w-5" />
        }
    }

    const getPackageLabel = (durationMonths: number) => {
        switch (durationMonths) {
            case 6:
                return 'En Popüler'
            case 12:
                return 'En Avantajlı'
            default:
                return null
        }
    }

    const handleContinue = () => {
        if (!selectedPackage) return
        const pkg = packages.find(p => p.id === selectedPackage)
        if (pkg) {
            // Seçilen paketi URL'e ekleyerek ürün sayfasına yönlendir
            router.push(`/products/${slug}?package=${pkg.id}`)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col bg-background">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
                <Footer />
            </div>
        )
    }

    if (packages.length === 0) {
        return (
            <div className="flex min-h-screen flex-col bg-background">
                <Header />
                <main className="flex-1">
                    <div className="mx-auto max-w-4xl px-4 py-12 text-center">
                        <h1 className="text-2xl font-bold mb-4">Paket Bulunamadı</h1>
                        <p className="text-muted-foreground mb-6">
                            Bu ürün için henüz paket tanımlanmamış.
                        </p>
                        <Button asChild>
                            <Link href={`/products/${slug}`}>Ürüne Dön</Link>
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    const selectedPkg = packages.find(p => p.id === selectedPackage)

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />

            <main className="flex-1">
                {/* Breadcrumb */}
                <div className="border-b border-border bg-card">
                    <div className="mx-auto max-w-4xl px-4 py-4">
                        <Link
                            href={`/products/${slug}`}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {product?.name || 'Ürüne Dön'}
                        </Link>
                    </div>
                </div>

                <div className="mx-auto max-w-4xl px-4 py-8 lg:py-12">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            Paket Seçin
                        </h1>
                        <p className="text-muted-foreground">
                            {product?.name} için size uygun üyelik paketini seçin
                        </p>
                    </div>

                    {/* Packages Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                        {packages.map((pkg) => {
                            const isSelected = selectedPackage === pkg.id
                            const label = getPackageLabel(pkg.duration_months)
                            const isPopular = pkg.duration_months === 6

                            return (
                                <Card
                                    key={pkg.id}
                                    className={`relative cursor-pointer transition-all hover:shadow-lg ${isSelected
                                        ? 'ring-2 ring-primary border-primary'
                                        : 'hover:border-primary/50'
                                        } ${isPopular ? 'md:scale-105' : ''}`}
                                    onClick={() => setSelectedPackage(pkg.id)}
                                >
                                    {label && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <Badge className="bg-primary text-primary-foreground shadow-md">
                                                {label}
                                            </Badge>
                                        </div>
                                    )}

                                    <CardHeader className="text-center pb-2">
                                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                            }`}>
                                            {getPackageIcon(pkg.duration_months)}
                                        </div>
                                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                                        <CardDescription>
                                            {pkg.duration_months} Ay
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="text-center">
                                        <div className="mb-2">
                                            {pkg.original_price && (
                                                <span className="text-muted-foreground line-through text-sm block">
                                                    ₺{pkg.original_price}
                                                </span>
                                            )}
                                            <span className="text-3xl font-bold">₺{pkg.price}</span>
                                        </div>

                                        <p className="text-sm text-muted-foreground mb-2">
                                            Aylık ₺{pkg.monthly_equivalent}
                                        </p>

                                        {pkg.savings > 0 && (
                                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                                ₺{pkg.savings} Tasarruf
                                            </Badge>
                                        )}

                                        {/* İndirim Etiketi veya Yüzdesi */}
                                        {(pkg.discount_label || pkg.discount_percentage > 0) && (
                                            <div className="mt-2 text-xs font-medium text-green-600">
                                                {pkg.discount_label || `%${pkg.discount_percentage} indirimli`}
                                            </div>
                                        )}

                                        {/* Selection Indicator */}
                                        <div className={`mt-4 h-10 rounded-lg flex items-center justify-center transition-colors ${isSelected
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                            }`}>
                                            {isSelected ? (
                                                <span className="flex items-center gap-1 text-sm font-medium">
                                                    <Check className="h-4 w-4" />
                                                    Seçildi
                                                </span>
                                            ) : (
                                                <span className="text-sm">Seç</span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    <Separator className="my-8" />

                    {/* Summary & Continue */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h3 className="font-medium">Seçilen Paket</h3>
                                {selectedPkg ? (
                                    <p className="text-muted-foreground">
                                        {selectedPkg.name} - {selectedPkg.duration_months} Ay
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground">Lütfen bir paket seçin</p>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {selectedPkg && (
                                    <div className="text-right">
                                        <p className="text-2xl font-bold">₺{selectedPkg.price}</p>
                                        {selectedPkg.savings > 0 && (
                                            <p className="text-sm text-green-600">₺{selectedPkg.savings} tasarruf</p>
                                        )}
                                    </div>
                                )}

                                <Button
                                    size="lg"
                                    className="min-w-[140px]"
                                    disabled={!selectedPackage}
                                    onClick={handleContinue}
                                >
                                    Devam Et
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground mb-4">Tüm paketlerde dahil:</p>
                        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                                <Check className="h-4 w-4 text-green-500" />
                                7/24 Destek
                            </span>
                            <span className="flex items-center gap-1">
                                <Check className="h-4 w-4 text-green-500" />
                                Ücretsiz Güncellemeler
                            </span>
                            <span className="flex items-center gap-1">
                                <Check className="h-4 w-4 text-green-500" />
                                Anında Erişim
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
