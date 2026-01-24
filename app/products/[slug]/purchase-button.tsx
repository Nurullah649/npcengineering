"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ShoppingCart, X, LogIn } from "lucide-react"
import type { Product } from "@/lib/products"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface PurchaseButtonProps {
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

export function PurchaseButton({ product }: PurchaseButtonProps) {
  // Modal açık mı kapalı mı kontrolü
  const [isOpen, setIsOpen] = useState(false)
  // Yükleniyor durumu
  const [isLoading, setIsLoading] = useState(false)
  // Kullanıcı durumu
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()

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
        // İlk boşluğa kadar isim, kalanı soyisim varsayımı
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

  // Ödeme işlemini başlatan fonksiyon
  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()

    // Kullanıcı giriş yapmamışsa satın alma yapamaz
    if (!user) {
      router.push(`/login?redirect=/products/${product.slug}`)
      return
    }

    setIsLoading(true)

    try {
      // 1. API'ye istek at
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: product.slug,
          buyer: formData, // Formdan gelen veriler
        }),
      })

      const data = await response.json()

      // 2. Gelen HTML varsa sayfayı Shopier'e çevir ve OTOMATİK GÖNDER
      if (data.html) {
        // HTML içeriğini sayfaya bas
        document.documentElement.innerHTML = data.html

        // --- DÜZELTME BURADA ---
        // React scriptleri çalıştırmadığı için formu bulup biz gönderiyoruz.
        // Shopier formunun ID'si genelde 'shopier_payment_form' olur.
        const form = document.getElementById("shopier_payment_form") as HTMLFormElement

        if (form) {
          form.submit()
        } else {
          // ID ile bulunamazsa sayfadaki ilk formu bulup gönder (Yedek plan)
          const firstForm = document.querySelector("form")
          if (firstForm) firstForm.submit()
        }
        // -----------------------

      } else {
        alert(data.error || "Ödeme sistemi yanıt vermedi.")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Ödeme hatası:", error)
      alert("Bir bağlantı hatası oluştu.")
      setIsLoading(false)
    }
  }

  // Kullanıcı giriş yapmamışsa farklı buton göster
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
        <Button
          size="lg"
          className="w-full"
          asChild
        >
          <Link href={`/login?redirect=/products/${product.slug}`}>
            <LogIn className="mr-2 h-4 w-4" />
            Satın Almak İçin Giriş Yapın
          </Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Ürün satın almak için hesabınıza giriş yapmanız gerekmektedir.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* ANA BUTON */}
      <Button
        size="lg"
        className="w-full"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Satın Al - {formatPrice(product.price)}
      </Button>

      {/* MODAL (Açılır Pencere) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-lg bg-background p-6 shadow-lg border border-border">

            {/* Kapatma Butonu (X) */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Sipariş Bilgileri</h2>
              <p className="text-sm text-muted-foreground">
                Ödemeyi tamamlamak için iletişim bilgilerinizi girin.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handlePurchase} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Adınız"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Soyad</Label>
                  <Input
                    id="surname"
                    name="surname"
                    required
                    placeholder="Soyadınız"
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="ornek@email.com"
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="0555 555 55 55"
                  onChange={handleInputChange}
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Shopier'e Yönlendiriliyor...
                    </>
                  ) : (
                    `Ödemeye Geç (${formatPrice(product.price)})`
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}