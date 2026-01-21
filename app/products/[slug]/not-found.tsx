import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { FileQuestion, ArrowLeft } from "lucide-react"

export default function ProductNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Ürün Bulunamadı</h1>
          <p className="mt-4 text-muted-foreground">
            Aradığınız ürün mevcut değil veya kaldırılmış olabilir.
          </p>
          <Button className="mt-8" asChild>
            <Link href="/#products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tüm Ürünlere Dön
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
