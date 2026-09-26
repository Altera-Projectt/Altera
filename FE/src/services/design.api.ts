import api from '@/utils/axios'
import type { ApiResponse } from '@/types/api.types'

// ── Types ──────────────────────────────────────────────────────────────────

export interface Design {
  _id: string
  userId?: string
  prompt?: string
  style?: string
  shirtType?: string
  colorPalette?: string
  shirtColor: string
  customImage?: string
  previewImage?: string
  status: 'DRAFT' | 'SAVED'
  createdAt: string
  updatedAt?: string
}

export interface GenerateDesignPayload {
  prompt: string
  style?: string
  shirtType?: string
  colorPalette?: string
  shirtColor?: string
}

export interface GenerateDesignResponse {
  imageUrl: string
  preview: string
  prompt: string
  designId: string
  design: Design
}

export interface DesignsListResponse {
  designs: Design[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// kept for backward compat
export type DesignsResponse = DesignsListResponse

export interface GenerationHistoryItem {
  prompt: string
  imageUrl: string
  createdAt: string
}

export interface OrderDesignPayload {
  shippingAddress: {
    fullName: string
    phone: string
    address: string
    city: string
  }
  price: number
  note?: string
}

export interface UploadedCustomImage {
  _id: string
  url: string
  thumbnailUrl: string
  filename: string
  mimeType: string
  size: number
  createdAt: string
}

// ── Service ────────────────────────────────────────────────────────────────

export const DesignService = {
  uploadCustomImage: (file: File) => {
    const body = new FormData()
    body.append('image', file)
    return api.post<ApiResponse<{ image: UploadedCustomImage }>>('/designs/custom/uploads', body, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 })
  },
  getCustomImages: () => api.get<ApiResponse<{ images: UploadedCustomImage[] }>>('/designs/custom/uploads'),
  deleteCustomImage: (id: string, preserveFile = false) => api.delete<ApiResponse<void>>(`/designs/custom/uploads/${id}`, { params: { preserveFile } }),
  /** AI generate a new design from prompt */
  generateDesign: (payload: GenerateDesignPayload) =>
    api.post<ApiResponse<GenerateDesignResponse>>('/designs/generate', payload),

  /** Refine an existing design with a new prompt */
  refineDesign: (id: string, prompt: string) =>
    api.post<ApiResponse<GenerateDesignResponse>>(`/designs/${id}/refine`, { prompt }),

  /** Save a DRAFT design → SAVED */
  saveDesign: (id: string) =>
    api.post<ApiResponse<{ design: Design }>>(`/designs/${id}/save`),

  /** Create an order from an existing design */
  orderDesign: (id: string, payload: OrderDesignPayload) =>
    api.post<ApiResponse<{ order: any }>>(`/designs/${id}/order`, payload),

  /** Get current user's designs (paginated) */
  getMyDesigns: (page = 1, limit = 10) =>
    api.get<ApiResponse<DesignsListResponse>>('/designs/my', { params: { page, limit } }),

  /** Get generation history from cache */
  getGenerationHistory: () =>
    api.get<ApiResponse<{ history: GenerationHistoryItem[] }>>('/designs/generate/history'),

  /** Clear generation history cache */
  clearGenerationHistory: () =>
    api.delete<ApiResponse<void>>('/designs/generate/history'),

  /** Get a single design by ID */
  getDesign: (id: string) =>
    api.get<ApiResponse<{ design: Design }>>(`/designs/${id}`),

  /** Delete a design */
  deleteDesign: (id: string) =>
    api.delete<ApiResponse<void>>(`/designs/${id}`),
}
