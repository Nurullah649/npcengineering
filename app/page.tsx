import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { getAllProducts, getAllCategories } from "@/lib/products"
import { ArrowRight, Code2, Zap, Shield, HeartHandshake } from "lucide-react"
import Link from "next/link"

export default async function HomePage() {
  // Verileri veritabanından asenkron olarak çekiyoruz
  const products = await getAllProducts()
  const categories = await getAllCategories()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Premium Dijital Ürünler
                <span className="block text-accent">Geliştiriciler İçin</span>
              </h1>
              <p className="mt-6 text-pretty text-lg text-muted-foreground">
                Yüksek kaliteli şablonlar, boilerplate&apos;ler ve araçlar. Modern teknolojiler,
                temiz kod ve kapsamlı dokümantasyon ile projelerinizi hızlandırın.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="#products">
                    Ürünleri İncele
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="#about">Daha Fazla Bilgi</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-b border-border py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Code2 className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">Temiz Kod</h3>
                <p className="text-sm text-muted-foreground">
                  Best practice&apos;lere uygun, okunabilir ve sürdürülebilir kod yapısı.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">Hızlı Başlangıç</h3>
                <p className="text-sm text-muted-foreground">
                  Dakikalar içinde projenize entegre edin ve geliştirmeye başlayın.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">Güvenli</h3>
                <p className="text-sm text-muted-foreground">
                  Güvenlik standartlarına uygun, production-ready ürünler.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <HeartHandshake className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">Destek</h3>
                <p className="text-sm text-muted-foreground">
                  Kapsamlı dokümantasyon ve aktif destek ile yanınızdayız.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                Tüm Ürünler
              </h2>
              <p className="mt-4 text-muted-foreground">
                İhtiyacınıza uygun dijital ürünleri keşfedin
              </p>
            </div>

            {/* Category Filter */}
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              <Button variant="secondary" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Tümü
              </Button>
              {categories.map((category) => (
                <Button key={category} variant="outline" size="sm">
                  {category}
                </Button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="border-t border-border bg-card py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                NPC Engineering Hakkında
              </h2>
              <p className="mt-6 text-pretty text-muted-foreground">
                Biz, yazılım geliştiricilerin işini kolaylaştırmak için çalışan bir ekibiz.
                Yılların deneyimini yüksek kaliteli dijital ürünlere dönüştürüyor,
                modern teknolojilerle çalışan şablonlar, araçlar ve bileşenler üretiyoruz.
              </p>
              <p className="mt-4 text-pretty text-muted-foreground">
                Her ürünümüz kapsamlı test edilmiş, dokümante edilmiş ve production-ready olarak sunulmaktadır.
                Amacımız, projelerinizi daha hızlı tamamlamanıza yardımcı olmak.
              </p>
              <div className="mt-10 flex justify-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">6+</div>
                  <div className="text-sm text-muted-foreground">Ürün</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">7000+</div>
                  <div className="text-sm text-muted-foreground">İndirme</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">4.8</div>
                  <div className="text-sm text-muted-foreground">Ortalama Puan</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                Projenizi Hızlandırmaya Hazır mısınız?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Premium dijital ürünlerimizle geliştirme sürecinizi hızlandırın.
              </p>
              <Button size="lg" className="mt-8" asChild>
                <Link href="#products">
                  Hemen Başla
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}