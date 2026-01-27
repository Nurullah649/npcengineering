import { notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { getAllProducts, getProductBySlug } from "@/lib/products"
import {
  ArrowLeft,
  Check,
  Star,
  Download,
  Calendar,
  Tag
} from "lucide-react"
import { ProductScreenshots } from "./product-screenshots"
import { ProductPricing } from "./purchase-button"

// Sayfa cache'ini devre dışı bırak - her istekte güncel fiyat çek
export const dynamic = 'force-dynamic'

// Meta verileri (SEO başlıkları vb.) oluşturuyoruz
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return { title: "Ürün Bulunamadı" }
  }

  return {
    title: `${product.name} - NPC Engineering`,
    description: product.shortDescription,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Veritabanından ürünü çekiyoruz (await önemli)
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

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

        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Screenshots */}
            <div>
              <ProductScreenshots
                screenshots={product.screenshots}
                videoUrls={product.videoUrls}
                productName={product.name}
                category={product.category}
              />
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{product.category}</Badge>
                {discount > 0 && (
                  <Badge className="bg-accent text-accent-foreground">
                    {discount}% İndirim
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold text-foreground lg:text-4xl">
                {product.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {(product.rating ?? 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span>{product.rating} / 5</span>
                  </div>
                )}
                {(product.downloads ?? 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    <span>{product.downloads?.toLocaleString()} indirme</span>
                  </div>
                )}
                {product.version && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    <span>v{product.version}</span>
                  </div>
                )}
                {product.lastUpdated && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(product.lastUpdated).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
              </div>

              <p className="mt-6 text-muted-foreground">
                {product.description}
              </p>

              {/* Tech Stack */}
              {product.techStack && (
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-medium text-foreground">Teknolojiler</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.techStack.map((tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="mt-8">
                <h3 className="mb-4 text-sm font-medium text-foreground">Özellikler</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price & Purchase */}
              <div className="mt-8 rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-foreground">{product.price} ₺</span>
                  {product.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      {product.originalPrice} ₺
                    </span>
                  )}
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  Tek seferlik ödeme • Ömür boyu erişim • Ücretsiz güncellemeler
                </p>
                <ProductPricing product={product} />
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  30 gün para iade garantisi
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}