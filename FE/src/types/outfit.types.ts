export interface OutfitProduct {
  _id: string
  name: string
  description: string
  price: number
  category: string
  images: string[]
  stock: number
}

export interface OutfitRecommendation {
  recommendation: string
  products: OutfitProduct[]
}

export interface OutfitRecommendPayload {
  occasion?: string
  style?: string
  budget?: number
  preferences?: string
  top?: string
  bottom?: string
  shoes?: string
}

export interface OutfitHistoryItem {
  _id: string
  recommendation: string
  products: OutfitProduct[]
  createdAt: string
  [key: string]: unknown
}

export interface OutfitHistoryResponse {
  history: OutfitHistoryItem[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}
