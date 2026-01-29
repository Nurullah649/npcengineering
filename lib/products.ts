import { supabase } from './supabase'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  originalPrice?: number
  coverImage?: string       // SQL: cover_image
  category: string
  features: string[]
  screenshots: string[]
  videoUrls?: string[] // SQL: video_urls
  techStack?: string[]
  version?: string
  lastUpdated?: string // Veritabanındaki last_updated
  downloads?: number
  rating?: number
  packages?: Package[]
}

export interface Package {
  id: string
  name: string
  description?: string
  duration_months: number
  price: number
  multiplier?: number
  is_active: boolean
}

// Veritabanı sütun adlarını (snake_case) arayüzümüze (camelCase) çeviriyoruz
const mapDatabaseToProduct = (data: any): Product => ({
  id: data.id,
  name: data.name,
  slug: data.slug,
  description: data.description,
  shortDescription: data.short_description, // SQL: short_description
  price: data.price,
  originalPrice: data.original_price,       // SQL: original_price
  coverImage: data.cover_image,             // SQL: cover_image
  category: data.category,
  features: data.features || [],
  screenshots: data.screenshots || [],
  videoUrls: data.video_urls || [],         // SQL: video_urls
  techStack: data.tech_stack || [],         // SQL: tech_stack
  version: data.version,
  lastUpdated: data.last_updated,           // SQL: last_updated
  downloads: data.downloads,
  rating: data.rating,
  packages: data.packages?.map((pkg: any) => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    duration_months: pkg.duration_months,
    price: pkg.price,
    multiplier: pkg.multiplier,
    is_active: pkg.is_active
  })).sort((a: Package, b: Package) => a.price - b.price) || [] // Fiyata göre sırala
})

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    // DÜZELTME: Tablonda 'created_at' yok, 'last_updated' var.
    .order('last_updated', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data.map(mapDatabaseToProduct)
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const { data, error } = await supabase
    .from('products')
    .select('*, packages(*)')
    .eq('slug', slug)
    .single()

  if (error || !data) return undefined

  return mapDatabaseToProduct(data)
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .order('last_updated', { ascending: false }) // Kategoride de tarihe göre sıralamak iyidir

  if (error) return []

  return data.map(mapDatabaseToProduct)
}

export async function getAllCategories(): Promise<string[]> {
  const { data } = await supabase
    .from('products')
    .select('category')

  if (!data) return []

  // Benzersiz kategorileri filtrele ve temizle
  const categories = data
    .map(p => p.category)
    .filter((c): c is string => Boolean(c)) // null veya boş olanları temizle

  return [...new Set(categories)]
}