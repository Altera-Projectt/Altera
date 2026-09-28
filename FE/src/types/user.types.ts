/**
 * ALTERA — User Types
 */

export interface User {
  _id: string
  id: string
  fullName: string
  email: string
  phone?: string | null
  membershipPlanId?: string | null
  membershipStatus?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING'
  membershipStartDate?: string | null
  membershipEndDate?: string | null
  avatar: string | null
  role: 'USER' | 'ADMIN'
  createdAt: string
  updatedAt: string
}

export interface AuthUser {
  user: User
  token: string
}

// ── Auth payloads ──────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
}

export interface UpdateProfilePayload {
  fullName?: string
  avatar?: File
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
