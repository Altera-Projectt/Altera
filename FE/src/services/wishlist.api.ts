import api from '@/utils/axios'
import type { ApiResponse } from '@/types/api.types'

export interface WishlistProduct {
  _id: string
  name: string
  price: number
  imageUrl: string
  category: string
  stock: number
  isActive: boolean
}

export interface WishlistResponse {
  wishlist: {
    _id: string
    userId: string
    products: WishlistProduct[]
  }
}

export const WishlistService = {
  getWishlist: () =>
    api.get<ApiResponse<WishlistResponse>>('/wishlist'),

  addToWishlist: (productId: string) =>
    api.post<ApiResponse<WishlistResponse>>('/wishlist', { productId }),

  removeFromWishlist: (productId: string) =>
    api.delete<ApiResponse<WishlistResponse>>(`/wishlist/${productId}`),
}
