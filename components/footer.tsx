import Link from "next/link"
import Image from "next/image"
import { Github, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                <Image src="/npc_icon.ico" alt="NPC Engineering" fill className="object-contain" />
              </div>
              <span className="text-lg font-semibold text-foreground">NPC Engineering</span>
            </Link>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Geliştiriciler ve yaratıcılar için yüksek kaliteli dijital ürünler.
              Modern teknolojiler, temiz kod ve kapsamlı dokümantasyon.
            </p>
            <div className="mt-4 flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Ürünler</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/products/npc-dashboard-pro" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Dashboard Pro
                </Link>
              </li>
              <li>
                <Link href="/products/api-boilerplate-kit" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  API Boilerplate
                </Link>
              </li>
              <li>
                <Link href="/products/ui-component-library" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  UI Library
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Destek</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="mailto:support@npcengineering.com" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  İletişim
                </a>
              </li>
              <li>
                <Link href="/#about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Hakkımızda
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} NPC Engineering. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  )
}
