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
  slug?: string
  category: 'T-Shirt' | 'SHIRT' | string
  style?: string
  brand?: string
  price: number
  discountPrice?: number
  imageUrl: string
  description: string
  material?: string
  fit?: string
  gender?: string
  colors?: string[]
  sizes?: string[]
  rating?: number
  sold?: number
  stock: number
  isFeatured?: boolean
  isActive: boolean
  __v?: number
  createdAt?: string
  updatedAt?: string
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
  category?: string
  search?: string
  page?: number
  limit?: number
}
