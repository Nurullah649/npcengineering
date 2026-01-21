"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ShoppingCart, X } from "lucide-react"
import type { Product } from "@/lib/products"

interface PurchaseButtonProps {
  product: Product
}

export function PurchaseButton({ product }: PurchaseButtonProps) {
  // Modal açık mı kapalı mı kontrolü
  const [isOpen, setIsOpen] = useState(false)
  // Yükleniyor durumu
  const [isLoading, setIsLoading] = useState(false)

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

      // 2. Gelen HTML varsa sayfayı Shopier'e çevir
      if (data.html) {
        document.documentElement.innerHTML = data.html
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

  return (
    <>
      {/* ANA BUTON */}
      <Button
        size="lg"
        className="w-full"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Satın Al - ${product.price}
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
                    `Ödemeye Geç (${product.price} TL)`
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