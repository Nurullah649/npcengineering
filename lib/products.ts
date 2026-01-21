export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  price: number
  originalPrice?: number
  category: string
  features: string[]
  screenshots: string[]
  techStack?: string[]
  version?: string
  lastUpdated?: string
  downloads?: number
  rating?: number
}

export const products: Product[] = [
  {
    id: "1",
    name: "NPC Dashboard Pro",
    slug: "npc-dashboard-pro",
    description: "Profesyonel admin dashboard şablonu. Next.js 14, TypeScript ve Tailwind CSS ile oluşturulmuş, tamamen responsive ve özelleştirilebilir. 50+ hazır bileşen, 10+ sayfa şablonu ve kapsamlı dokümantasyon içerir.",
    shortDescription: "Profesyonel admin dashboard şablonu",
    price: 79,
    originalPrice: 129,
    category: "Template",
    features: [
      "Next.js 14 App Router",
      "TypeScript desteği",
      "50+ UI bileşeni",
      "Dark/Light mod",
      "Responsive tasarım",
      "Kapsamlı dokümantasyon",
      "6 ay ücretsiz güncelleme",
      "Premium destek"
    ],
    screenshots: [
      "/screenshots/dashboard-1.jpg",
      "/screenshots/dashboard-2.jpg",
      "/screenshots/dashboard-3.jpg"
    ],
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui"],
    version: "2.1.0",
    lastUpdated: "2026-01-15",
    downloads: 1250,
    rating: 4.9
  },
  {
    id: "2",
    name: "API Boilerplate Kit",
    slug: "api-boilerplate-kit",
    description: "Production-ready API starter kit. Node.js, Express ve PostgreSQL ile oluşturulmuş, JWT authentication, rate limiting, validation ve error handling dahil. Microservice mimarisine uygun.",
    shortDescription: "Production-ready API starter kit",
    price: 49,
    originalPrice: 89,
    category: "Boilerplate",
    features: [
      "Node.js & Express",
      "PostgreSQL entegrasyonu",
      "JWT Authentication",
      "Rate limiting",
      "Input validation",
      "Error handling",
      "Docker desteği",
      "CI/CD pipeline"
    ],
    screenshots: [
      "/screenshots/api-1.jpg",
      "/screenshots/api-2.jpg",
      "/screenshots/api-3.jpg"
    ],
    techStack: ["Node.js", "Express", "PostgreSQL", "Docker"],
    version: "1.5.0",
    lastUpdated: "2026-01-10",
    downloads: 890,
    rating: 4.8
  },
  {
    id: "3",
    name: "UI Component Library",
    slug: "ui-component-library",
    description: "100+ premium React bileşeni. Figma dosyaları dahil, tam erişilebilirlik desteği, detaylı props dokümantasyonu ve Storybook entegrasyonu ile gelir.",
    shortDescription: "100+ premium React bileşeni",
    price: 99,
    originalPrice: 149,
    category: "Component",
    features: [
      "100+ React bileşeni",
      "Figma dosyaları",
      "A11y uyumlu",
      "Storybook dokümantasyonu",
      "Tree-shaking desteği",
      "Tema özelleştirme",
      "Copy-paste kullanım",
      "TypeScript desteği"
    ],
    screenshots: [
      "/screenshots/ui-1.jpg",
      "/screenshots/ui-2.jpg",
      "/screenshots/ui-3.jpg"
    ],
    techStack: ["React", "TypeScript", "Tailwind CSS", "Radix UI"],
    version: "3.0.0",
    lastUpdated: "2026-01-18",
    downloads: 2100,
    rating: 5.0
  },
  {
    id: "4",
    name: "E-Commerce Starter",
    slug: "ecommerce-starter",
    description: "Tam özellikli e-ticaret başlangıç kiti. Stripe ödeme entegrasyonu, ürün yönetimi, sepet sistemi, sipariş takibi ve admin paneli dahil.",
    shortDescription: "Tam özellikli e-ticaret başlangıç kiti",
    price: 149,
    originalPrice: 249,
    category: "Template",
    features: [
      "Stripe entegrasyonu",
      "Ürün yönetimi",
      "Sepet sistemi",
      "Sipariş takibi",
      "Admin paneli",
      "SEO optimizasyonu",
      "Email bildirimleri",
      "Çoklu dil desteği"
    ],
    screenshots: [
      "/screenshots/ecommerce-1.jpg",
      "/screenshots/ecommerce-2.jpg",
      "/screenshots/ecommerce-3.jpg"
    ],
    techStack: ["Next.js", "Stripe", "Prisma", "PostgreSQL"],
    version: "1.2.0",
    lastUpdated: "2026-01-12",
    downloads: 670,
    rating: 4.7
  },
  {
    id: "5",
    name: "Auth System Complete",
    slug: "auth-system-complete",
    description: "Güvenli authentication sistemi. Email/password, OAuth (Google, GitHub, Twitter), 2FA, magic links ve session yönetimi dahil. GDPR uyumlu.",
    shortDescription: "Güvenli authentication sistemi",
    price: 59,
    originalPrice: 99,
    category: "Boilerplate",
    features: [
      "Email/Password auth",
      "OAuth providers",
      "İki faktörlü doğrulama",
      "Magic links",
      "Session yönetimi",
      "GDPR uyumlu",
      "Role-based access",
      "Audit logging"
    ],
    screenshots: [
      "/screenshots/auth-1.jpg",
      "/screenshots/auth-2.jpg",
      "/screenshots/auth-3.jpg"
    ],
    techStack: ["Next.js", "Auth.js", "Prisma", "PostgreSQL"],
    version: "2.0.0",
    lastUpdated: "2026-01-08",
    downloads: 1580,
    rating: 4.9
  },
  {
    id: "6",
    name: "CLI Tools Bundle",
    slug: "cli-tools-bundle",
    description: "Geliştirici verimliliğini artıran CLI araçları paketi. Project scaffolding, code generation, database migration ve deployment otomasyonu dahil.",
    shortDescription: "Geliştirici CLI araçları paketi",
    price: 39,
    category: "Tool",
    features: [
      "Project scaffolding",
      "Code generation",
      "Database migrations",
      "Deployment scripts",
      "Git workflow",
      "Environment management",
      "Cross-platform",
      "Extensible plugins"
    ],
    screenshots: [
      "/screenshots/cli-1.jpg",
      "/screenshots/cli-2.jpg",
      "/screenshots/cli-3.jpg"
    ],
    techStack: ["Node.js", "TypeScript", "Commander.js"],
    version: "1.8.0",
    lastUpdated: "2026-01-05",
    downloads: 450,
    rating: 4.6
  }
]

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug)
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter(p => p.category === category)
}

export function getAllCategories(): string[] {
  return [...new Set(products.map(p => p.category))]
}
