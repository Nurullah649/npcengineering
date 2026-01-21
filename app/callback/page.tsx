import type { Metadata } from "next"
import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CallbackContent } from "./callback-content"

export const metadata: Metadata = {
  title: "İşlem Sonucu - NPC Engineering",
  description: "Ödeme işlemi sonucu",
  robots: "noindex, nofollow",
}

export default function CallbackPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          }
        >
          <CallbackContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}
