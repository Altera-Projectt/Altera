import api from '@/utils/axios'
import type { ApiResponse } from '@/types/api.types'

export interface MarketplaceDesign {
  _id: string
  slug: string
  name: string
  description: string
  thumbnail: string
  price: number
  category: string
  color: { name: string; hex: string }
  size: string
  designerId: { username: string; displayName: string; avatar?: string }
  productId?: { name: string; category: string; imageUrl?: string }
  likesCount: number
  salesCount: number
  isLiked: boolean
}

export interface MarketplaceQuery {
  search?: string
  category?: string
  color?: string
  size?: string
  minPrice?: number
  maxPrice?: number
  designer?: string
  sort?: string
  page?: number
  limit?: number
}

export interface MarketplaceResponse {
  designs: MarketplaceDesign[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface FeaturedDesigner {
  _id: string
  username: string
  displayName: string
  avatar?: string
  coverImage?: string
  publishedDesigns: number
  followersCount: number
  salesCount: number
}

export const MarketplaceService = {
  list: (params: MarketplaceQuery) => api.get<ApiResponse<MarketplaceResponse>>('/designers/marketplace', { params }),
  featuredDesigners: (limit = 8) => api.get<ApiResponse<{ designers: FeaturedDesigner[] }>>('/designers/featured', { params: { limit } }),
  getLikedDesigns: () => api.get<ApiResponse<{ designs: MarketplaceDesign[] }>>('/designers/me/likes'),
}
