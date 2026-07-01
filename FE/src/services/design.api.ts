import api from '@/utils/axios'
import type { ApiResponse } from '@/types/api.types'

export interface Design {
  _id: string
  userId: string
  name: string
  shirtType?: string
  shirtColor?: string
  imageUrl?: string
  prompt?: string
  isPublic?: boolean
  createdAt: string
  updatedAt: string
}

export interface DesignsResponse {
  designs: Design[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const DesignService = {
  getMyDesigns: (page = 1, limit = 12) =>
    api.get<ApiResponse<DesignsResponse>>('/designs/my', { params: { page, limit } }),

  getDesign: (id: string) =>
    api.get<ApiResponse<{ design: Design }>>(`/designs/${id}`),

  createDesign: (payload: Partial<Design>) =>
    api.post<ApiResponse<{ design: Design }>>('/designs', payload),

  updateDesign: (id: string, payload: Partial<Design>) =>
    api.put<ApiResponse<{ design: Design }>>(`/designs/${id}`, payload),

  deleteDesign: (id: string) =>
    api.delete<ApiResponse<void>>(`/designs/${id}`),
}
