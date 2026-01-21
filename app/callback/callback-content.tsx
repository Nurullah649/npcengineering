"use client"

import React from "react"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CheckCircle2,
  XCircle,
  Download,
  Mail,
  ArrowRight,
  Home,
  RefreshCw,
  MessageCircle,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Copy
} from "lucide-react"
import { useState } from "react"
import { copyToClipboard } from "@/utils/copy-to-clipboard"

export function CallbackContent() {
  const searchParams = useSearchParams()
  
  // Shopier'den gelen parametreler
  const status = searchParams.get("status") // "success" veya "failed"
  const product = searchParams.get("product")
  const price = searchParams.get("price")
  const error = searchParams.get("error")
  const orderId = searchParams.get("order_id") || `NPC-${Date.now()}`

  const isSuccess = status === "success"
  
  // Form state
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAccountCreated, setIsAccountCreated] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    username?: string
    password?: string
    confirmPassword?: string
  }>({})
  const [credentials, setCredentials] = useState<{ username: string, password: string } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const validateForm = () => {
    const errors: typeof formErrors = {}
    
    if (!username.trim()) {
      errors.username = "Kullanici adi gerekli"
    } else if (username.length < 3) {
      errors.username = "Kullanici adi en az 3 karakter olmali"
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = "Sadece harf, rakam ve alt cizgi kullanilabilir"
    }
    
    if (!password) {
      errors.password = "Sifre gerekli"
    } else if (password.length < 6) {
      errors.password = "Sifre en az 6 karakter olmali"
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = "Sifre tekrari gerekli"
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Sifreler eslesmiyor"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    // Simulate account creation
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    setIsAccountCreated(true)
    setIsSubmitting(false)
    setCredentials({ username: "newUser", password: "newPassword123" })
  }

if (isSuccess) {
    // Hesap olusturuldu - basarili ekrani
    if (isAccountCreated) {
      return (
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
              <CheckCircle2 className="h-10 w-10 text-accent" />
            </div>

            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Hesabiniz Olusturuldu!
            </h1>

            <p className="mt-4 text-muted-foreground">
              Artik urunlerinize erisebilirsiniz.
            </p>

            {/* Product Info */}
            <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-sm text-muted-foreground">Satin Alinan Urun</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {product ? decodeURIComponent(product) : "Dijital Urun"}
              </p>
              {price && (
                <p className="mt-1 text-2xl font-bold text-accent">${price}</p>
              )}
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Siparis No: {orderId}
              </p>
            </div>

            {/* Account Info */}
            <div className="mt-6 rounded-xl border-2 border-accent/30 bg-accent/5 p-6">
              <h3 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold text-foreground">
                <User className="h-5 w-5 text-accent" />
                Hesap Bilgileriniz
              </h3>
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  Kullanici Adi
                </div>
                <code className="font-mono text-sm text-foreground">{username}</code>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Sifrenizi guvenli bir yerde sakladiginizdan emin olun.
              </p>
            </div>

            {/* Next Steps */}
            <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">Sonraki Adimlar</h3>
              <ul className="space-y-3 text-left text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>Hesap bilgileriniz e-posta adresinize gonderildi.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Download className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>Urunlerinizi hemen asagidaki butondan indirebilirsiniz.</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 space-y-3">
              <Button size="lg" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Urunu Indir
              </Button>
              <Button variant="outline" size="lg" className="w-full bg-transparent" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Ana Sayfaya Don
                </Link>
              </Button>
            </div>

            {/* Support Info */}
            <p className="mt-8 text-xs text-muted-foreground">
              Herhangi bir sorunuz varsa{" "}
              <a
                href="mailto:destek@npcengineering.com"
                className="text-accent underline underline-offset-2 hover:text-accent/80"
              >
                destek@npcengineering.com
              </a>{" "}
              adresinden bize ulasabilirsiniz.
            </p>
          </div>

          {/* Continue Shopping */}
          <div className="mt-6 text-center">
            <Link
              href="/#products"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Diger urunleri kesfet
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )
    }

    // Hesap olusturma formu
    return (
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          {/* Success Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-10 w-10 text-accent" />
          </div>

          <h1 className="text-center text-2xl font-bold text-foreground md:text-3xl">
            Satin Alma Basarili!
          </h1>

          <p className="mt-4 text-center text-muted-foreground">
            Urunlerinize erismek icin bir hesap olusturun.
          </p>

          {/* Product Info */}
          <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">Satin Alinan Urun</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {product ? decodeURIComponent(product) : "Dijital Urun"}
            </p>
            {price && (
              <p className="mt-1 text-2xl font-bold text-accent">${price}</p>
            )}
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Siparis No: {orderId}
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleCreateAccount} className="mt-8 space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2 text-foreground">
                <User className="h-4 w-4" />
                Kullanici Adi
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="kullanici_adi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={formErrors.username ? "border-destructive" : ""}
              />
              {formErrors.username && (
                <p className="text-xs text-destructive">{formErrors.username}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-foreground">
                <Lock className="h-4 w-4" />
                Sifre
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={formErrors.password ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-destructive">{formErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-foreground">
                <Lock className="h-4 w-4" />
                Sifre Tekrar
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Sifrenizi tekrar girin"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={formErrors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-xs text-destructive">{formErrors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Hesap Olusturuluyor...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Hesap Olustur
                </>
              )}
            </Button>
          </form>

          {/* Support Info */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Herhangi bir sorunuz varsa{" "}
            <a
              href="mailto:destek@npcengineering.com"
              className="text-accent underline underline-offset-2 hover:text-accent/80"
            >
              destek@npcengineering.com
            </a>{" "}
            adresinden bize ulasabilirsiniz.
          </p>
        </div>
      </div>
    )
  }

  // Failed State
  return (
    <div className="w-full max-w-lg">
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        {/* Error Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>

        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          İşlem Başarısız
        </h1>

        <p className="mt-4 text-muted-foreground">
          Satın alma işlemiz tamamlanamadı. Lütfen aşağıdaki olası nedenleri kontrol edin.
        </p>

        {/* Error Code */}
        {error && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-muted-foreground">Hata Kodu</p>
            <p className="mt-1 font-mono text-lg font-semibold text-destructive">
              {error}
            </p>
          </div>
        )}

        {/* Possible Reasons */}
        <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Olası Nedenler</h3>
          <ul className="space-y-2 text-left text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              <span>Ödeme bilgileriniz doğrulanamadı</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              <span>Yetersiz bakiye veya limit aşımı</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              <span>Bağlanti zaman aşımına uğradı</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              <span>Kart bilgileri hatalı girildi</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          <Button size="lg" className="w-full" asChild>
            <Link href={product ? `/products/${product}` : "/"}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tekrar Dene
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full bg-transparent" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Ana Sayfaya Dön
            </Link>
          </Button>
        </div>

        {/* Support */}
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">Sorun devam ederse</p>
          <a
            href="mailto:destek@npcengineering.com"
            className="mt-2 inline-flex items-center gap-2 text-accent hover:underline"
          >
            <MessageCircle className="h-4 w-4" />
            destek@npcengineering.com
          </a>
        </div>
      </div>
    </div>
  )
}
