import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    ArrowLeft,
    Check,
    QrCode,
    Smartphone,
    Users,
    ChefHat,
    BarChart3,
    Bell,
    CreditCard,
    Settings,
    Headphones,
    ArrowRight,
    Coffee,
    UtensilsCrossed,
    Store
} from "lucide-react"
import { getProductBySlug } from "@/lib/products"
import { ProductScreenshots } from "@/app/products/[slug]/product-screenshots"

export const dynamic = 'force-dynamic'

// SEO Meta Verileri
export async function generateMetadata() {
    return {
        title: "SiparişGo - Restoran ve Kafe için QR Menü Sipariş Sistemi | NPC Engineering",
        description: "QR kod ile dijital menü, anlık sipariş takibi, masa yönetimi ve detaylı raporlama. Garson çağırma stresine son verin, siparişlerinizi dijitalleştirin. 7 gün ücretsiz deneyin!",
        keywords: "QR menü, dijital menü, restoran sipariş sistemi, kafe yönetimi, masa takip, sipariş takibi, garson uygulaması, restoran yazılımı, QR kod menü",
        openGraph: {
            title: "SiparişGo - Restoran ve Kafe için QR Menü Sipariş Sistemi",
            description: "QR kod ile dijital menü, anlık sipariş takibi ve masa yönetimi. İşletmenizi dijitalleştirin!",
            type: "website",
        }
    }
}

export default async function SiparisGoPage() {
    // Veritabanından ürün verilerini çek (screenshots ve videos için)
    const product = await getProductBySlug("siparisgo")

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />

            <main className="flex-1">
                {/* Breadcrumb */}
                <div className="border-b border-border bg-card">
                    <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
                        <Link
                            href="/#products"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Tüm Ürünler
                        </Link>
                    </div>
                </div>

                {/* Hero Section */}
                <section className="relative overflow-hidden border-b border-border">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
                    <div className="relative mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
                        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                            {/* Sol Taraf - Metin */}
                            <div>
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                        Restoran & Kafe
                                    </Badge>
                                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                                        7 Gün Ücretsiz Deneme
                                    </Badge>
                                </div>

                                <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                                    SiparişGo
                                    <span className="block text-orange-500 mt-2">QR Menü & Sipariş Sistemi</span>
                                </h1>

                                <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                                    Müşterileriniz masalarındaki <strong>QR kodu okutarak</strong> dijital menünüze ulaşsın,
                                    siparişlerini versin. Siz de <strong>anlık bildirimlerle</strong> siparişleri takip edin,
                                    mutfağa iletin. <strong>Garson çağırma stresine son!</strong>
                                </p>

                                {/* Hızlı Faydalar */}
                                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                    {[
                                        "Kağıt menü maliyetine son",
                                        "Siparişlerde %40 hız artışı",
                                        "Anlık sesli bildirimler",
                                        "Kolay masa yönetimi"
                                    ].map((benefit) => (
                                        <div key={benefit} className="flex items-center gap-2">
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20">
                                                <Check className="h-3 w-3 text-green-500" />
                                            </div>
                                            <span className="text-sm text-muted-foreground">{benefit}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA Butonları */}
                                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                                    <Button size="lg" className="bg-orange-500 hover:bg-orange-600" asChild>
                                        <Link href="#pricing">
                                            Ücretsiz Denemeyi Başlat
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="lg" asChild>
                                        <Link href="#demo">Canlı Demo İzle</Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Sağ Taraf - Ürün Görselleri & Videoları */}
                            <div className="relative">
                                {product && ((product.screenshots && product.screenshots.length > 0) || (product.videoUrls && product.videoUrls.length > 0)) ? (
                                    <ProductScreenshots
                                        screenshots={product.screenshots || []}
                                        videoUrls={product.videoUrls || []}
                                        productName={product.name || "SiparişGo"}
                                        category={product.category || "Restoran & Kafe"}
                                    />
                                ) : (
                                    <div className="rounded-2xl border border-border bg-gradient-to-b from-card to-background p-8 shadow-2xl">
                                        <div className="flex items-center justify-center gap-8">
                                            {/* QR Kod Görseli (Fallback) */}
                                            <div className="flex flex-col items-center">
                                                <div className="rounded-xl bg-white p-4">
                                                    <QrCode className="h-32 w-32 text-gray-900" />
                                                </div>
                                                <span className="mt-3 text-sm text-muted-foreground">Masa QR Kodu</span>
                                            </div>
                                            {/* Telefon Mock (Fallback) */}
                                            <div className="flex flex-col items-center">
                                                <div className="rounded-3xl border-4 border-gray-700 bg-gray-900 p-2">
                                                    <div className="h-48 w-24 rounded-2xl bg-gradient-to-b from-orange-500/20 to-orange-600/20 flex items-center justify-center">
                                                        <Smartphone className="h-12 w-12 text-orange-400" />
                                                    </div>
                                                </div>
                                                <span className="mt-3 text-sm text-muted-foreground">Dijital Menü</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Nasıl Çalışır */}
                <section id="demo" className="py-16 lg:py-24 border-b border-border">
                    <div className="mx-auto max-w-7xl px-4 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                                Nasıl Çalışır?
                            </h2>
                            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                                3 basit adımda işletmenizi dijitalleştirin, müşteri memnuniyetini artırın
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {/* Adım 1 */}
                            <div className="relative">
                                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white font-bold">
                                    1
                                </div>
                                <div className="rounded-xl border border-border bg-card p-6 pl-8">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                                        <QrCode className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-foreground">Müşteri QR Okuttur</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Müşteriniz masasındaki QR kodu telefonuyla okutarak dijital menünüze anında ulaşır.
                                        Uygulama indirmesine <strong>gerek yok!</strong>
                                    </p>
                                </div>
                            </div>

                            {/* Adım 2 */}
                            <div className="relative">
                                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white font-bold">
                                    2
                                </div>
                                <div className="rounded-xl border border-border bg-card p-6 pl-8">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                                        <UtensilsCrossed className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-foreground">Siparişi Sepete Eklesin</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Kategorilere göre düzenlenmiş menüden ürünleri seçsin, sepete eklesin ve tek tuşla siparişini versin.
                                    </p>
                                </div>
                            </div>

                            {/* Adım 3 */}
                            <div className="relative">
                                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white font-bold">
                                    3
                                </div>
                                <div className="rounded-xl border border-border bg-card p-6 pl-8">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                                        <Bell className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-foreground">Siz Bildirim Alın</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Siparişler anında yönetim panelinize düşer, <strong>sesli bildirim</strong> ile haberdar olursunuz.
                                        Mutfağa tek tıkla iletin.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Özellikler */}
                <section className="py-16 lg:py-24 border-b border-border bg-card/50">
                    <div className="mx-auto max-w-7xl px-4 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                                Ne Elde Edeceksiniz?
                            </h2>
                            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                                SiparişGo ile işletmenizi bir üst seviyeye taşıyın
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Özellik 1 */}
                            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-orange-500/50 hover:shadow-lg">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
                                    <Smartphone className="h-6 w-6 text-orange-500" />
                                </div>
                                <h3 className="mb-2 font-semibold text-foreground">Dijital Menü</h3>
                                <p className="text-sm text-muted-foreground">
                                    Görsel açıklamalarla zenginleştirilmiş kategorize menü.
                                    Fiyat güncellemelerini anında yansıtın, kağıt menü maliyetine son verin.
                                </p>
                            </div>

                            {/* Özellik 2 */}
                            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-orange-500/50 hover:shadow-lg">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                                    <Users className="h-6 w-6 text-blue-500" />
                                </div>
                                <h3 className="mb-2 font-semibold text-foreground">Masa Yönetimi</h3>
                                <p className="text-sm text-muted-foreground">
                                    Hangi masa dolu, hangisinde bekleyen sipariş var? Tüm masalarınızı tek ekrandan yönetin.
                                </p>
                            </div>

                            {/* Özellik 3 */}
                            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-orange-500/50 hover:shadow-lg">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                                    <ChefHat className="h-6 w-6 text-green-500" />
                                </div>
                                <h3 className="mb-2 font-semibold text-foreground">Mutfak Koordinasyonu</h3>
                                <p className="text-sm text-muted-foreground">
                                    Siparişleri &quot;Hazırlanıyor&quot;, &quot;Hazır&quot;, &quot;Teslim Edildi&quot; durumlarıyla takip edin.
                                    Müşteri de durumu görsün.
                                </p>
                            </div>

                            {/* Özellik 4 */}
                            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-orange-500/50 hover:shadow-lg">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                                    <Bell className="h-6 w-6 text-yellow-500" />
                                </div>
                                <h3 className="mb-2 font-semibold text-foreground">Sesli Bildirimler</h3>
                                <p className="text-sm text-muted-foreground">
                                    Yeni sipariş geldiğinde anında sesli uyarı alın. Hiçbir siparişi kaçırmayın.
                                </p>
                            </div>

                            {/* Özellik 5 */}
                            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-orange-500/50 hover:shadow-lg">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                    <QrCode className="h-6 w-6 text-purple-500" />
                                </div>
                                <h3 className="mb-2 font-semibold text-foreground">Otomatik QR Kod</h3>
                                <p className="text-sm text-muted-foreground">
                                    Her masa için benzersiz QR kod otomatik oluşturulur. İndirin ve masalarınıza yerleştirin.
                                </p>
                            </div>

                            {/* Özellik 6 */}
                            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-orange-500/50 hover:shadow-lg">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/20 to-rose-500/20">
                                    <BarChart3 className="h-6 w-6 text-red-500" />
                                </div>
                                <h3 className="mb-2 font-semibold text-foreground">Sipariş Geçmişi</h3>
                                <p className="text-sm text-muted-foreground">
                                    Tüm geçmiş siparişleri detaylı raporlarla inceleyin. Hangi ürün çok satıyor görün.
                                </p>
                            </div>

                            {/* Özellik 7 */}
                            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-orange-500/50 hover:shadow-lg">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                                    <Settings className="h-6 w-6 text-cyan-500" />
                                </div>
                                <h3 className="mb-2 font-semibold text-foreground">Kolay Ürün Yönetimi</h3>
                                <p className="text-sm text-muted-foreground">
                                    Ürün ekleyin, düzenleyin, stok durumunu güncelleyin.
                                    Stokta olmayan ürünleri tek tıkla devre dışı bırakın.
                                </p>
                            </div>

                            {/* Özellik 8 */}
                            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-orange-500/50 hover:shadow-lg">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-green-500/20">
                                    <CreditCard className="h-6 w-6 text-teal-500" />
                                </div>
                                <h3 className="mb-2 font-semibold text-foreground">Hesap & Ödeme</h3>
                                <p className="text-sm text-muted-foreground">
                                    Masa hesabını tek tuşla kapatın. Toplam tutarı görün ve ödeme aldıktan sonra masayı sıfırlayın.
                                </p>
                            </div>

                            {/* Özellik 9 */}
                            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-orange-500/50 hover:shadow-lg">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                                    <Headphones className="h-6 w-6 text-indigo-500" />
                                </div>
                                <h3 className="mb-2 font-semibold text-foreground">7/24 Destek</h3>
                                <p className="text-sm text-muted-foreground">
                                    Herhangi bir sorun yaşadığınızda destek ekibimiz yanınızda.
                                    Hızlı ve çözüm odaklı yaklaşım.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Kimlere Uygun */}
                <section className="py-16 lg:py-24 border-b border-border">
                    <div className="mx-auto max-w-7xl px-4 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                                Kimler İçin Ideal?
                            </h2>
                            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                                Yiyecek-içecek sektöründeki tüm işletmeler için tasarlandı
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-6">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                                    <Coffee className="h-6 w-6 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Kafeler</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Kahve, tatlı ve atıştırmalık siparişlerini hızlandırın
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-6">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                                    <UtensilsCrossed className="h-6 w-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Restoranlar</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Ana yemek, içecek ve tatlı menüsünü profesyonelce sunun
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-6">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                                    <Store className="h-6 w-6 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Fast-Food</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Hızlı sipariş akışı ve yoğun saatlerde verimlilik
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Fiyatlandırma */}
                <section id="pricing" className="py-16 lg:py-24 border-b border-border bg-gradient-to-b from-card/50 to-background">
                    <div className="mx-auto max-w-7xl px-4 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                                Uygun Fiyat, Büyük Değer
                            </h2>
                            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                                7 gün ücretsiz deneyin, beğenmezseniz ödeme yapmayın
                            </p>
                        </div>

                        <div className="mx-auto max-w-lg">
                            <div className="rounded-2xl border-2 border-orange-500/50 bg-card p-8 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 text-sm font-medium rounded-bl-lg">
                                    En Popüler
                                </div>

                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-foreground">SiparişGo Pro</h3>
                                    <p className="mt-2 text-muted-foreground">Tüm özellikler dahil</p>
                                </div>

                                <div className="text-center mb-8">
                                    <div className="flex items-baseline justify-center gap-2">
                                        {/* GÜNCELLENEN KISIM */}
                                        <span className="text-5xl font-bold text-foreground">₺1000</span>
                                        <span className="text-muted-foreground">/ay</span>
                                    </div>
                                    <p className="mt-2 text-sm text-green-500">İlk 7 gün ücretsiz</p>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {[
                                        "Sınırsız masa",
                                        "Sınırsız ürün",
                                        "Anlık bildirimler",
                                        "QR kod oluşturma",
                                        "Detaylı raporlama",
                                        "Teknik destek",
                                        "Mobil uyumlu panel",
                                        "Güncellemeler dahil"
                                    ].map((feature) => (
                                        <li key={feature} className="flex items-center gap-3">
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20">
                                                <Check className="h-3 w-3 text-green-500" />
                                            </div>
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600" asChild>
                                    <Link href="/register?product=siparisgo">
                                        Ücretsiz Denemeyi Başlat
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>

                                <p className="mt-4 text-center text-xs text-muted-foreground">
                                    Kredi kartı gerekmez • İstediğiniz zaman iptal
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SSS */}
                <section className="py-16 lg:py-24 border-b border-border">
                    <div className="mx-auto max-w-4xl px-4 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                                Sıkça Sorulan Sorular
                            </h2>
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-xl border border-border bg-card p-6">
                                <h3 className="font-semibold text-foreground">Müşterinin uygulama indirmesi gerekir mi?</h3>
                                <p className="mt-2 text-muted-foreground">
                                    Hayır! Müşterileriniz sadece QR kodu okutur ve tarayıcıda menünüz açılır.
                                    Uygulama indirme, kayıt olma gibi adımlar yok.
                                </p>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-6">
                                <h3 className="font-semibold text-foreground">Kurulum zor mu?</h3>
                                <p className="mt-2 text-muted-foreground">
                                    Hayır! Kayıt olduktan sonra ürünlerinizi ekleyin, masalarınızı tanımlayın ve
                                    QR kodları indirerek masalara yapıştırın. 10 dakikada hazır!
                                </p>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-6">
                                <h3 className="font-semibold text-foreground">İnternet kesilirse ne olur?</h3>
                                <p className="mt-2 text-muted-foreground">
                                    İnternet bağlantınız kesilirse sistem çalışmaz. Ancak siparişler kaydedilmiş
                                    olduğundan internet geldiğinde görüntüleyebilirsiniz.
                                </p>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-6">
                                <h3 className="font-semibold text-foreground">Aboneliği iptal edebilir miyim?</h3>
                                <p className="mt-2 text-muted-foreground">
                                    Evet! İstediğiniz zaman aboneliğinizi iptal edebilirsiniz.
                                    7 günlük deneme süresinde iptal ederseniz hiçbir ücret alınmaz.
                                </p>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-6">
                                <h3 className="font-semibold text-foreground">Destek alabilir miyim?</h3>
                                <p className="mt-2 text-muted-foreground">
                                    Elbette! Teknik destek ekibimiz size yardımcı olmak için hazır.
                                    Panel içindeki destek butonundan bize ulaşabilirsiniz.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Son CTA */}
                <section className="py-16 lg:py-24 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10">
                    <div className="mx-auto max-w-4xl px-4 lg:px-8 text-center">
                        <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                            İşletmenizi Dijitalleştirmeye Hazır mısınız?
                        </h2>
                        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                            Binlerce restoran ve kafe gibi siz de SiparişGo ile müşteri deneyimini
                            iyileştirin, operasyonel verimliliği artırın.
                        </p>
                        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                            <Button size="lg" className="bg-orange-500 hover:bg-orange-600" asChild>
                                <Link href="/register?product=siparisgo">
                                    7 Gün Ücretsiz Başla
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" asChild>
                                <Link href="/contact">Bize Ulaşın</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
