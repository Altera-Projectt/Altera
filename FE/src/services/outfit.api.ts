import api from '@/utils/axios'
import type { ApiResponse } from '@/types/api.types'

// ── Quiz ──────────────────────────────────────────────────────────────────

export interface QuizPayload {
  favoriteItem?: string
  favoriteColor?: string
  personality?: string
  occasion?: string
}

export interface QuizResult {
  style: string
  reason: string
  keywords: string[]
  colorPalette: string[]
  avoidColors: string[]
  keyPieces: string[]
}

// ── Recommend ─────────────────────────────────────────────────────────────

export interface RecommendPayload {
  quiz?: QuizPayload
  style?: string
  gender?: string
  season?: string
  budget?: number
  occasion?: string
  quizResult?: QuizResult
}

export interface ColorGuide {
  main: string
  secondary: string
  accent: string
  avoid: string
  example: string
}

export interface CompleteOutfit {
  top: string
  bottom: string
  shoes: string
  accessories: string
}

export interface RecommendResult {
  style: string
  reason: string
  outfitNote: string
  colorGuide: ColorGuide
  weatherTips: string
  bodyTips: string
  tips: string[]
  completeOutfit: CompleteOutfit
  recommendedProducts: any[]
  productReasoning: { productName: string; reason: string }[]
  quizResult?: QuizResult
  recordId?: string
}

// ── History ───────────────────────────────────────────────────────────────

export interface OutfitHistoryItem {
  _id: string
  style: string
  aiSuggestion: string
  tips: string[]
  occasion: string
  createdAt: string
  products: any[]
}

export interface OutfitHistoryResponse {
  history: OutfitHistoryItem[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ── Service ───────────────────────────────────────────────────────────────

export const StylistService = {
  /** POST /stylist/quiz — analyse quiz answers, return style + palette + keyPieces */
  analyzeQuiz: (payload: QuizPayload) =>
    api.post<ApiResponse<QuizResult>>('/stylist/quiz', payload),

  /** POST /stylist/recommend — generate full outfit recommendation */
  recommend: (payload: RecommendPayload) =>
    api.post<ApiResponse<RecommendResult>>('/stylist/recommend', payload),

  /** GET /stylist/history */
  getHistory: (page = 1, limit = 10) =>
    api.get<ApiResponse<OutfitHistoryResponse>>('/stylist/history', { params: { page, limit } }),
}

// Backwards-compatible alias so any existing import still works
export const OutfitService = StylistService
