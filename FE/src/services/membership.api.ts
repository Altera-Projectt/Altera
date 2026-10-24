import api from '@/utils/axios'
import type { ApiResponse } from '@/types/api.types'
import type { User } from '@/types/user.types'
export type MembershipPlan = { _id: string; code: 'BASIC' | 'PREMIUM' | 'PRO_STUDIO'; name: string; description: string; price: number; currency: string; billingCycle: 'FREE' | 'MONTHLY' | 'YEARLY'; features: string[] }
export type BankConfig = { bankCode: string; bankName: string; accountNumber: string; accountName: string }
export type BankTransferInfo = { bankCode?: string; bankName: string; accountName: string; accountNumber: string; amount: number; paymentReference?: string; paymentContent: string; qrCodeUrl: string }
export const MembershipService = {
  plans: () => api.get<ApiResponse<{ plans: MembershipPlan[]; bankConfig?: BankConfig }>>('/membership/plans'),
  current: () => api.get<ApiResponse<{ membership: { membershipPlanId: MembershipPlan | null; membershipStatus: string; membershipStartDate: string | null; membershipEndDate: string | null } }>>('/membership/current'),
  checkout: (payload: { planCode: string; paymentMethod?: string; fullName?: string; email?: string; phone?: string }) => api.post<ApiResponse<{ free?: boolean; paymentUrl?: string; paymentReference?: string; transfer?: BankTransferInfo }>>('/membership/checkout', payload),
  upgrade: (payload: { tier: 'PREMIUM' | 'PRO'; paymentMethod?: string; paymentReference?: string }) => api.post<ApiResponse<{ user: User; message?: string }>>('/membership/upgrade', payload),
  result: (reference: string) => api.get<ApiResponse<{ order: { status: string; amount: number; paymentMethod: string; paidAt: string | null; paymentReference: string; membershipPlanId: { name: string; code: string } }; payment: { paymentStatus: string; transactionId: string | null }; membership: { membershipStatus: string } }>>(`/payments/membership/${encodeURIComponent(reference)}`),
  history: () => api.get<ApiResponse<{ payments: Array<{ _id: string; status: string; paymentReference: string; amount: number; paymentMethod: string; transactionId: string | null; createdAt: string; membershipPlanId: { name: string; code: string } }> }>>('/membership/payments/history'),
  verifyBank: (id: string, action: 'verify' | 'reject', reason?: string) => api.patch(`/membership/admin/payments/${id}/verify`, { action, reason }),
}
