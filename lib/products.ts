import { supabase } from './supabase'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string // Veritabanında short_description olabilir, mapleyeceğiz
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

// Veritabanından gelen veriyi bizim arayüzümüze (interface) uyduran yardımcı fonksiyon
const mapDatabaseToProduct = (data: any): Product => ({
  ...data,
  shortDescription: data.short_description,
  originalPrice: data.original_price,
  lastUpdated: data.last_updated,
  techStack: data.tech_stack,
})

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

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

  if (error) return []

  return data.map(mapDatabaseToProduct)
}

export async function getAllCategories(): Promise<string[]> {
  const { data } = await supabase
    .from('products')
    .select('category')
  
  if (!data) return []

  // Benzersiz kategorileri filtrele
  const categories = data.map(p => p.category)
  return [...new Set(categories)]
}