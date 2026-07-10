/**
 * ALTERA — Product Types
 */

export interface ProductColor {
  name: string
  hex: string
  imageUrl?: string
  stock: number
}

export interface ProductSize {
  label: string
  stock: number
  measurements?: {
    chest?: number
    length?: number
    shoulder?: number
  }
}

export interface Product {
  _id: string
  name: string
  slug?: string
  description: string
  category: 'T-Shirt' | 'Hoodie' | 'Pants' | 'Shorts' | 'Jacket' | 'Accessory' | 'Shoes' | string
  style?: 'Oversize' | 'Boxy' | 'Slim' | 'Regular' | 'Crop' | 'Baby Tee' | 'Polo' | string
  fit?: string
  material?: string
  brand?: string
  gender?: 'Men' | 'Women' | 'Unisex' | string
  price: number
  discountPrice?: number | null
  imageUrl: string
  images?: string[]
  colors?: ProductColor[]
  sizes?: ProductSize[]
  stock: number
  tags?: string[]
  rating?: number
  sold?: number
  isFeatured?: boolean
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
  category?: string
  search?: string
  page?: number
  limit?: number
  gender?: string
  style?: string
  fit?: string
  color?: string
  minPrice?: number
  maxPrice?: number
}
