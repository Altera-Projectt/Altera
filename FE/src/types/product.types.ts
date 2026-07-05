/**
 * ALTERA — Product Types
 */

/* 
export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'
export type ProductGender = 'MEN' | 'WOMEN' | 'UNISEX'

export interface ProductVariant {
  size: ProductSize
  color: string
  stock: number
  sku?: string
}
*/

export interface Product {
  _id: string
  name: string
  category: 'SHIRT' | 'PANTS' | 'SHOES' | 'ACCESSORY'
  price: number
  imageUrl: string
  description: string
  stock: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductReview {
  _id: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

// ── Filters ────────────────────────────────────────────────────────────────

export interface ProductFilters {
  category?: 'SHIRT' | 'PANTS' | 'SHOES' | 'ACCESSORY'
  search?: string
  page?: number
  limit?: number
}
