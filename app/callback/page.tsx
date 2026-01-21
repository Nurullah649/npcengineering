import Link from "next/link"
import { CheckCircle2, XCircle, Home, ArrowRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

// Next.js 15 ve sonrası için searchParams Promise olarak gelir
export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // URL parametrelerini okuyoruz
  const params = await searchParams
  const status = params.status
  const orderId = params.order_id
  const error = params.error

  const isSuccess = status === "success"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="mx-auto max-w-md w-full text-center space-y-8">

          {/* İKON ALANI */}
          <div className="flex justify-center animate-in zoom-in duration-500">
            {isSuccess ? (
              <div className="rounded-full bg-green-100 p-6 dark:bg-green-900/30 ring-8 ring-green-50 dark:ring-green-900/10">
                <CheckCircle2 className="h-20 w-20 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="rounded-full bg-red-100 p-6 dark:bg-red-900/30 ring-8 ring-red-50 dark:ring-red-900/10">
                <XCircle className="h-20 w-20 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>

          {/* MESAJ ALANI */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {isSuccess ? "Ödeme Başarılı!" : "Ödeme Başarısız"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isSuccess
                ? "Siparişiniz başarıyla alındı. Teşekkür ederiz."
                : "Ödeme işlemi sırasında bir sorun oluştu."}
            </p>
          </div>

          {/* DETAY KUTUSU */}
          <div className="rounded-xl border bg-card p-6 shadow-sm text-left space-y-3">
            <div className="flex justify-between items-center py-1 border-b border-border/50 pb-3">
              <span className="text-muted-foreground text-sm">İşlem Durumu</span>
              <span className={`font-medium ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                {isSuccess ? 'Onaylandı' : 'Reddedildi'}
              </span>
            </div>

            {orderId && (
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground text-sm">Sipariş No</span>
                <span className="font-mono font-medium text-foreground">{orderId}</span>
              </div>
            )}

            {!isSuccess && error && (
               <div className="flex justify-between items-center py-1">
               <span className="text-muted-foreground text-sm">Hata Kodu</span>
               <span className="font-mono text-sm text-red-500">{error}</span>
             </div>
            )}
          </div>

          {/* BUTONLAR */}
          <div className="flex flex-col gap-3 pt-2">
            {isSuccess ? (
              // Başarılıysa Dashboard'a veya Ürünlere yönlendir
              <Link href="/dashboard" className="w-full">
                <Button className="w-full h-12 text-base" size="lg">
                  Siparişlerime Git <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              // Başarısızsa Tekrar Dene veya İletişim
              <Link href="/" className="w-full">
                <Button variant="destructive" className="w-full h-12 text-base">
                  Tekrar Dene
                </Button>
              </Link>
            )}

            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full h-12">
                <Home className="mr-2 h-4 w-4" />
                Ana Sayfaya Dön
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}