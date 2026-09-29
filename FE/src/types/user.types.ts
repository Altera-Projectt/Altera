/**
 * ALTERA — User Types
 */

export interface User {
  _id: string
  id: string
  fullName: string
  email: string
  authProvider?: 'LOCAL' | 'GOOGLE'
  phone?: string | null
  membershipPlanId?: string | null
  membershipStatus?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING'
  membershipStartDate?: string | null
  membershipEndDate?: string | null
  avatar: string | null
  coverImage?: string | null
  bio?: string
  location?: string
  role: 'USER' | 'ADMIN'
  measurements?: {
    height?: number
    weight?: number
    shirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
    shoeSize?: string
  }
  preferences?: {
    styles?: string[]
    favoriteColors?: string[]
    avoidColors?: string[]
  }
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
  bio?: string
  location?: string
  avatar?: File
  coverImage?: File
}

export interface UpdateMeasurementsPayload {
  height?: number
  weight?: number
  shirtSize?: string
  shoeSize?: string
}

export interface UpdatePreferencesPayload {
  styles?: string[]
  favoriteColors?: string[]
  avoidColors?: string[]
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
