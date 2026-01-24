'use client'

import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, Suspense } from "react"
import { CheckCircle2, XCircle, Home, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CallbackContent />
    </Suspense>
  )
}

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const status = searchParams.get('status')
  const orderId = searchParams.get('order_id')
  const error = searchParams.get('error')
  const product = searchParams.get('product')

  const isSuccess = status === "success"

  // SiparisGO ürünü için onboarding sayfasına yönlendir (client-side)
  useEffect(() => {
    if (isSuccess && product === "siparisgo" && orderId) {
      router.push(`/onboarding/siparisgo?order_id=${orderId}`)
    }
  }, [isSuccess, product, orderId, router])

  // SiparisGO için yönlendirme bekleniyorsa loading göster
  if (isSuccess && product === "siparisgo" && orderId) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">SiparisGO kurulumuna yönlendiriliyorsunuz...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

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
            <p className="text-muted-foreground">
              {isSuccess ? (
                <>
                  Siparişiniz başarıyla tamamlandı.
                  {orderId && (
                    <span className="block mt-2 text-sm">
                      Sipariş No: <span className="font-mono font-medium text-foreground">{orderId}</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  Ödeme işlemi sırasında bir hata oluştu.
                  {error && (
                    <span className="block mt-2 text-sm text-destructive">
                      Hata Kodu: {error}
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          {/* BUTONLAR */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isSuccess ? (
              <>
                <Button asChild>
                  <Link href="/dashboard/orders">
                    Siparişlerime Git
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Ana Sayfa
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild>
                  <Link href="/#products">
                    Tekrar Dene
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Ana Sayfa
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}