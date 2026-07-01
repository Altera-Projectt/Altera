import api from '@/utils/axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  OutfitRecommendation,
  OutfitRecommendPayload,
  OutfitHistoryResponse,
} from '@/types/outfit.types'

export const OutfitService = {
  getRecommendation: (payload: OutfitRecommendPayload) =>
    api.post<ApiResponse<OutfitRecommendation>>('/outfits/recommend', payload),

  getHistory: (page = 1, limit = 10) =>
    api.get<ApiResponse<OutfitHistoryResponse>>('/outfits/history', { params: { page, limit } }),
}
