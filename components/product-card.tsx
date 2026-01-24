import Link from "next/link"
import { ArrowRight, Star, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/products"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-accent hover:shadow-lg hover:shadow-accent/5">
        {/* Preview Image Area */}
        <div className="relative aspect-video bg-secondary/50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <span className="text-lg font-bold text-accent">NPC</span>
              </div>
              <p className="text-xs text-muted-foreground">{product.category}</p>
            </div>
          </div>
          {discount > 0 && (
            <Badge className="absolute right-3 top-3 bg-accent text-accent-foreground">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
            {product.rating && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-accent text-accent" />
                <span>{product.rating}</span>
              </div>
            )}
          </div>

          <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-accent">
            {product.name}
          </h3>

          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {product.shortDescription}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">{product.price} ₺</span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {product.originalPrice} ₺
                </span>
              )}
            </div>
            {product.downloads && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Download className="h-3 w-3" />
                <span>{product.downloads}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
            <span>İncele</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}
