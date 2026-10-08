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
  idea: string
  style: string
  printSide: 'Front' | 'Back' | 'Both Sides'
  globalShirtColor: string
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
  designId?: string
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

export type AssetSource = 'UPLOAD' | 'AI'

export interface UploadedCustomImage {
  _id: string
  url: string
  thumbnailUrl: string
  filename: string
  mimeType: string
  size: number
  /** Missing on legacy records, which are uploads. */
  source?: AssetSource
  prompt?: string
  designId?: string | null
  createdAt: string
}

export interface CustomDesignDraft {
  _id: string
  name: string
  productId: string | { _id: string } | null
  color: { name: string; hex: string } | null
  size: string
  printSide: 'FRONT' | 'BACK' | 'BOTH'
  printingTechnique: string
  frontDesign: { layers: Record<string, unknown>[]; background?: unknown }
  backDesign: { layers: Record<string, unknown>[]; background?: unknown }
  thumbnail: string
  createdAt: string
  updatedAt: string
}

export interface DesignTemplate {
  _id: string
  name: string
  thumbnail: string
  category: string
  style: string
  tags: string[]
  description: string
  frontDesign: { layers: Record<string, unknown>[] }
  backDesign: { layers: Record<string, unknown>[] }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ── Service ────────────────────────────────────────────────────────────────

export const DesignService = {
  publishCustomDraft: (payload: { 
    draftId: string; 
    name: string; 
    description: string; 
    price: number; 
    category?: string; 
    tags?: string[]; 
    collectionId?: string;
    shirtColor?: string;
    designUrl?: string;
    decalTransform?: { rotation: number; scale: number; opacity: number };
    thumbnailUrl?: string;
  }) => api.post<ApiResponse<{ design: any }>>('/designers/me/designs', payload),
  getMyDesignerProfile: () => api.get<ApiResponse<{ profile: { username: string } }>>('/designers/me/profile'),
  getDesignerCollections: (username: string) => api.get<ApiResponse<{ collections: { _id: string; name: string }[] }>>(`/designers/${username}`),
  uploadCustomImage: (file: File) => {
    const body = new FormData()
    body.append('image', file)
    return api.post<ApiResponse<{ image: UploadedCustomImage }>>('/designs/custom/uploads', body, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 })
  },
  getCustomImages: (source?: AssetSource) => api.get<ApiResponse<{ images: UploadedCustomImage[] }>>('/designs/custom/uploads', { params: source ? { source } : undefined }),
  /** Save an AI-generated design image into the personal asset library (idempotent). */
  saveGeneratedToLibrary: (designId: string) => api.post<ApiResponse<{ image: UploadedCustomImage }>>('/designs/custom/uploads/from-generated', { designId }),
  createDesignerCollection: (name: string) => api.post<ApiResponse<{ collection: { _id: string; name: string } }>>('/designers/me/collections', { name }),
  deleteCustomImage: (id: string, preserveFile = false) => api.delete<ApiResponse<void>>(`/designs/custom/uploads/${id}`, { params: { preserveFile } }),
  listCustomDrafts: () => api.get<ApiResponse<{ drafts: CustomDesignDraft[] }>>('/designs/custom/drafts'),
  createCustomDraft: (payload: Partial<CustomDesignDraft>) => api.post<ApiResponse<{ draft: CustomDesignDraft }>>('/designs/custom/drafts', payload),
  getCustomDraft: (id: string) => api.get<ApiResponse<{ draft: CustomDesignDraft }>>(`/designs/custom/drafts/${id}`),
  updateCustomDraft: (id: string, payload: Partial<CustomDesignDraft>) => api.put<ApiResponse<{ draft: CustomDesignDraft }>>(`/designs/custom/drafts/${id}`, payload),
  duplicateCustomDraft: (id: string) => api.post<ApiResponse<{ draft: CustomDesignDraft }>>(`/designs/custom/drafts/${id}/duplicate`),
  deleteCustomDraft: (id: string) => api.delete<ApiResponse<void>>(`/designs/custom/drafts/${id}`),
  listDesignTemplates: (params?: { search?: string; category?: string; style?: string }) => api.get<ApiResponse<{ templates: DesignTemplate[] }>>('/templates', { params }),
  getDesignTemplate: (id: string) => api.get<ApiResponse<{ template: DesignTemplate }>>(`/templates/${id}`),
  /** AI generate a new design from prompt */
  generateDesign: (payload: GenerateDesignPayload) =>
    api.post<ApiResponse<GenerateDesignResponse>>('/designs/generate', payload, { timeout: 120_000 }),

  /** Refine an existing design with a new prompt */
  refineDesign: (id: string, prompt: string) =>
    api.post<ApiResponse<GenerateDesignResponse>>(`/designs/${id}/refine`, { prompt }, { timeout: 120_000 }),

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
