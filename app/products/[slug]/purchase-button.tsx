"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, ShoppingCart } from "lucide-react"
import type { Product } from "@/lib/products"

interface PurchaseButtonProps {
  product: Product
}

export function PurchaseButton({ product }: PurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handlePurchase = async () => {
    setIsLoading(true)
    
    // Simulate purchase process
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    // Simulate random success/failure (80% success rate)
    const isSuccess = Math.random() > 0.2
    
    if (isSuccess) {
      // Redirect to callback page with success status
      router.push(`/callback?status=success&product=${encodeURIComponent(product.name)}&price=${product.price}`)
    } else {
      // Redirect to callback page with failed status
      const errorCodes = ["ERR_PAYMENT_001", "ERR_CARD_002", "ERR_TIMEOUT_003", "ERR_BALANCE_004"]
      const randomError = errorCodes[Math.floor(Math.random() * errorCodes.length)]
      router.push(`/callback?status=failed&product=${product.slug}&error=${randomError}`)
    }
  }

  return (
    <Button 
      size="lg" 
      className="w-full" 
      onClick={handlePurchase}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          İşleniyor...
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Satın Al - ${product.price}
        </>
      )}
    </Button>
  )
}
