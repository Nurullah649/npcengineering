"use client"

import React from "react"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    // Eğer ana sayfadaysak, doğrudan scroll yap
    if (pathname === "/") {
      e.preventDefault()
      const element = document.getElementById(sectionId)
      if (element) {
        const headerOffset = 80
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.scrollY - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        })
      }
    }
    // Başka sayfadaysak, Link normal çalışsın (ana sayfaya yönlendir)
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <span className="text-sm font-bold text-accent-foreground">NPC</span>
          </div>
          <span className="text-lg font-semibold text-foreground">NPC Engineering</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Ana Sayfa
          </Link>
          <Link 
            href="/#products" 
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={(e) => scrollToSection(e, "products")}
          >
            Ürünler
          </Link>
          <Link 
            href="/#about" 
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={(e) => scrollToSection(e, "about")}
          >
            Hakkımızda
          </Link>
        </div>

        <div className="hidden md:block">
          <Button asChild>
            <Link href="/#products" onClick={(e) => scrollToSection(e, "products")}>
              Ürünleri İncele
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="space-y-1 px-4 py-4">
            <Link
              href="/"
              className="block rounded-lg px-3 py-2 text-base text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ana Sayfa
            </Link>
            <Link
              href="/#products"
              className="block rounded-lg px-3 py-2 text-base text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={(e) => scrollToSection(e, "products")}
            >
              Ürünler
            </Link>
            <Link
              href="/#about"
              className="block rounded-lg px-3 py-2 text-base text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={(e) => scrollToSection(e, "about")}
            >
              Hakkımızda
            </Link>
            <div className="pt-2">
              <Button asChild className="w-full">
                <Link href="/#products" onClick={(e) => scrollToSection(e, "products")}>
                  Ürünleri İncele
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
