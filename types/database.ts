/**
 * Database Types for NPC Engineering
 * 
 * These types mirror the Supabase database schema for better type safety
 */

// User roles
export type UserRole = 'admin' | 'user'

// Order statuses
export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled'

// Profile (from profiles table)
export interface Profile {
    id: string
    email: string
    full_name: string | null
    phone: string | null
    role: UserRole
    address_line1: string | null
    address_line2: string | null
    city: string | null
    district: string | null
    postal_code: string | null
    tc_kimlik: string | null
    created_at: string
    updated_at: string | null
}

// Order (from orders table)
export interface Order {
    id: string
    user_id: string
    product_id: string
    amount: number
    status: OrderStatus
    shopier_order_id: string | null
    created_at: string
    updated_at: string | null
}

// Order with relations (for admin panel)
export interface OrderWithRelations extends Order {
    profiles: Pick<Profile, 'email' | 'full_name'> | null
    products: Pick<Product, 'name'> | null
}

// Product (from products table)
export interface Product {
    id: string
    name: string
    slug: string
    description: string
    short_description: string | null
    price: number
    original_price: number | null
    category: string
    features: string[]
    tech_stack: string[]
    version: string | null
    image_url: string | null
    demo_url: string | null
    is_active: boolean
    created_at: string
    last_updated: string | null
}

// Form types for creating/updating
export type ProfileUpdate = Partial<Pick<Profile,
    'full_name' | 'phone' | 'address_line1' | 'address_line2' |
    'city' | 'district' | 'postal_code' | 'tc_kimlik'
>>

export type ProductCreate = Omit<Product, 'id' | 'created_at' | 'last_updated'>
export type ProductUpdate = Partial<ProductCreate>

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

// Pagination
export interface PaginationParams {
    page: number
    limit: number
}

export interface PaginatedResult<T> {
    data: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}
