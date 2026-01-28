"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ShoppingCart, X, LogIn, CheckCircle2, Circle } from "lucide-react"
import type { Product, Package } from "@/lib/products"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { cn } from "@/lib/utils"

interface ProductPricingProps {
  product: Product
}

// TL formatında fiyat gösterimi
function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function ProductPricing({ product }: ProductPricingProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Paket Seçimi
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)

  // Auto-open modal logic
  useEffect(() => {
    const urlPackageId = searchParams.get('package')
    const shouldBuy = searchParams.get('buy') === 'true'

    if (urlPackageId && product.packages?.some(p => p.id === urlPackageId)) {
      setSelectedPackageId(urlPackageId)
      if (shouldBuy) {
        setIsOpen(true)
      }
    } else if (product.packages && product.packages.length > 0) {
      // Otomatik ilk paketi seç (Opsiyonel)
      setSelectedPackageId(product.packages[0].id)
    }
  }, [searchParams, product.packages])

  // Seçili Paketi Bul
  const selectedPackage = product.packages?.find(p => p.id === selectedPackageId)

  // Gösterilecek Fiyat (Paket varsa paket fiyatı, yoksa ürün fiyatı)
  const displayPrice = selectedPackage
    ? (selectedPackage.multiplier ? product.price * selectedPackage.multiplier : selectedPackage.price)
    : product.price

  // Modal açık mı kapalı mı kontrolü
  const [isOpen, setIsOpen] = useState(false)
  // Yükleniyor durumu
  const [isLoading, setIsLoading] = useState(false)
  // Kullanıcı durumu
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  // Auth state kontrolü
  useEffect(() => {
    async function loadUserAndProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthLoading(false)

      if (user) {
        // Profil bilgisini çek
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single()

        const fullName = profile?.full_name || user.user_metadata?.full_name || ''
        const parts = fullName.trim().split(' ')
        const name = parts[0] || ''
        const surname = parts.slice(1).join(' ') || ''

        setFormData(prev => ({
          ...prev,
          name: name,
          surname: surname,
          email: user.email || '',
          phone: profile?.phone || '',
        }))

        // Check for active subscription or past completed orders
        // Eğer siparisgo için aktif aboneliği veya geçmiş siparişi varsa trial gösterme.
        const { count } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing', 'past_due']); // canceled vs hariç

        // Ayrıca orders tablosuna da bakabiliriz (completed)
        const { count: orderCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'paid');

        if ((count && count > 0) || (orderCount && orderCount > 0)) {
          setHasActiveSubscription(true);
        }
      }
    }

    loadUserAndProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Form verileri
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
  })

  // Form elemanları değiştiğinde state'i güncelle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Deneme Sürümü Başlatma (Modal Açmadan)
  const handleTrialStart = async () => {
    if (!user) {
      router.push(`/login?redirect=/products/${product.slug}`)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/start-trial', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Deneme sürümü başlatılamadı')
      }

      toast.success("Deneme üyeliğiniz başlatıldı! Kuruluma yönlendiriliyorsunuz...")

      setTimeout(() => {
        router.push('/dashboard?welcome=true')
      }, 1500)

    } catch (error: any) {
      console.error("Trial error:", error)
      toast.error(error.message || "Bir hata oluştu")
      setIsLoading(false) // Sadece hata durumunda loading'i kapat, başarıda yönleniyor
    }
  }

  // Ödeme işlemini başlatan fonksiyon (Modal içinden tetiklenir)
  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      router.push(`/login?redirect=/products/${product.slug}`)
      return
    }

    setIsLoading(true)

    // Normal Ödeme (Ücretli)
    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: product.slug,
          packageId: selectedPackageId, // Seçili paket ID'si
          buyer: formData,
        }),
      })

      const data = await response.json()

      if (data.html) {
        // Shopier HTML açma mantığı (Aynı)
        const paymentWindow = window.open('', '_blank')
        if (paymentWindow) {
          paymentWindow.document.open()
          paymentWindow.document.write(data.html)
          paymentWindow.document.close()
          const form = paymentWindow.document.getElementById('shopier_payment_form') as HTMLFormElement
          if (form) form.submit()
          else paymentWindow.document.querySelector('form')?.submit()
        } else {
          // Fallback iframe
          const iframe = document.createElement('iframe')
          iframe.style.display = 'none'
          document.body.appendChild(iframe)
          const doc = iframe.contentDocument || iframe.contentWindow?.document
          if (doc) {
            doc.open(); doc.write(data.html); doc.close();
            const f = doc.getElementById('shopier_payment_form') as HTMLFormElement
            if (f) { f.target = '_self'; window.location.href = f.action }
          }
        }
      } else {
        toast.error(data.error || "Ödeme sistemi yanıt vermedi.")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Ödeme hatası:", error)
      toast.error("Ödeme başlatılamadı.")
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <Button size="lg" className="w-full" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Yükleniyor...
      </Button>
    )
  }

  if (!user) {
    return (
      <div className="space-y-3">
        {/* Paket Listesi (Giriş yapmamış olsa bile görsün) */}
        {product.packages && product.packages.length > 0 && (
          <div className="grid gap-3 mb-6">
            {product.packages.map(pkg => (
              <div
                key={pkg.id}
                className={cn(
                  "relative flex items-center justify-between rounded-xl border p-4 transition-all hover:border-primary/50 cursor-pointer",
                  selectedPackageId === pkg.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card"
                )}
                onClick={() => setSelectedPackageId(pkg.id)}
              >
                <div className="flex items-center gap-3">
                  {selectedPackageId === pkg.id
                    ? <CheckCircle2 className="h-5 w-5 text-primary" />
                    : <Circle className="h-5 w-5 text-muted-foreground" />
                  }
                  <div>
                    <p className="font-medium">{pkg.name}</p>
                    <p className="text-sm text-muted-foreground">{pkg.duration_months} Ay</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {formatPrice(pkg.multiplier ? product.price * pkg.multiplier : pkg.price)}
                  </p>
                  {pkg.multiplier && pkg.multiplier < pkg.duration_months && (
                    <span className="text-xs text-green-600 font-medium">
                      Avantajlı
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Button size="lg" className="w-full" asChild>
          <Link href={`/login?redirect=/products/${product.slug}`}>
            <LogIn className="mr-2 h-4 w-4" />
            Satın Almak İçin Giriş Yapın
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Paket Listesi */}
        {product.packages && product.packages.length > 0 ? (
          <div className="space-y-3">
            <Label>Abonelik Paketi Seçin</Label>
            <div className="grid gap-3">
              {product.packages.map(pkg => {
                const price = pkg.multiplier ? product.price * pkg.multiplier : pkg.price;
                return (
                  <div
                    key={pkg.id}
                    className={cn(
                      "relative flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer",
                      selectedPackageId === pkg.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                    onClick={() => setSelectedPackageId(pkg.id)}
                  >
                    <div className="flex items-center gap-3">
                      {selectedPackageId === pkg.id
                        ? <CheckCircle2 className="h-5 w-5 text-primary fill-primary/10" />
                        : <Circle className="h-5 w-5 text-muted-foreground" />
                      }
                      <div>
                        <p className="font-semibold text-foreground">{pkg.name}</p>
                        <p className="text-sm text-muted-foreground">{pkg.description || `${pkg.duration_months} Aylık Erişim`}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-foreground">
                        {formatPrice(price)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          null // Paket yoksa default (ürün fiyatı) gösterilir
        )}

        {/* Satın Al Butonu */}
        {(displayPrice !== 0 || !hasActiveSubscription) ? (
          <Button
            size="lg"
            className="w-full text-lg h-12"
            onClick={() => {
              if (displayPrice === 0) {
                handleTrialStart()
              } else {
                setIsOpen(true)
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
            {displayPrice === 0 ? "Ücretsiz Denemeyi Başlat" : `Satın Al - ${formatPrice(displayPrice)}`}
          </Button>
        ) : (
          <div className="text-center p-3 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">7 Günlük Deneme Sürümü daha önce kullanılmış veya aktif üyeliğiniz var.</p>
          </div>
        )}

        {/* MODAL */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-lg bg-background p-6 shadow-lg border border-border">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">Sipariş Bilgileri</h2>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{product.name}</span>
                  {selectedPackage && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-foreground">{selectedPackage.name}</span>
                    </>
                  )}
                </div>
                <p className="text-2xl font-bold mt-2 text-primary">{formatPrice(displayPrice)}</p>
              </div>

              <form onSubmit={handlePurchase} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ad</Label>
                    <Input id="name" name="name" required placeholder="Adınız" onChange={handleInputChange} value={formData.name || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surname">Soyad</Label>
                    <Input id="surname" name="surname" required placeholder="Soyadınız" onChange={handleInputChange} value={formData.surname || ''} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input id="email" name="email" type="email" required placeholder="ornek@email.com" onChange={handleInputChange} value={formData.email || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" name="phone" type="tel" required placeholder="0555 555 55 55" onChange={handleInputChange} value={formData.phone || ''} />
                  <p className="text-xs text-muted-foreground">Sipariş bilgilendirmesi için kullanılacaktır.</p>
                </div>
                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Shopier'e Yönlendiriliyor...
                      </>
                    ) : (
                      `Ödemeye Geç`
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}