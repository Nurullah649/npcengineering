import { supabase } from './supabase'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  originalPrice?: number
  category: string
  features: string[]
  screenshots: string[]
  techStack?: string[]
  version?: string
  lastUpdated?: string // Veritabanındaki last_updated
  downloads?: number
  rating?: number
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
  category: data.category,
  features: data.features || [],
  screenshots: data.screenshots || [],
  techStack: data.tech_stack || [],         // SQL: tech_stack
  version: data.version,
  lastUpdated: data.last_updated,           // SQL: last_updated
  downloads: data.downloads,
  rating: data.rating
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
    .select('*')
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