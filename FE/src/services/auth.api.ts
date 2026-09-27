import api from '@/utils/axios'
import type { ApiResponse } from '@/types/api.types'
import type { 
  AuthUser, 
  User, 
  LoginPayload, 
  RegisterPayload, 
  UpdateProfilePayload,
  UpdateMeasurementsPayload,
  UpdatePreferencesPayload
} from '@/types/user.types'

export const AuthService = {
  login: (payload: LoginPayload) =>
    api.post<ApiResponse<AuthUser>>('/auth/login', payload),

  loginWithGoogle: (token: string) =>
    api.post<ApiResponse<AuthUser>>('/auth/google', { token }),

  register: (payload: RegisterPayload) =>
    api.post<ApiResponse<AuthUser>>('/auth/register', payload),

  getMe: () =>
    api.get<ApiResponse<{ user: User }>>('/auth/me'),

  updateProfile: (payload: UpdateProfilePayload) => {
    return api.put<ApiResponse<{ user: User }>>('/users/me/basic', payload)
  },

  updateAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post<ApiResponse<{ user: User }>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  updateCoverImage: (file: File) => {
    const formData = new FormData()
    formData.append('coverImage', file)
    return api.post<ApiResponse<{ user: User }>>('/users/me/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  updateMeasurements: (payload: UpdateMeasurementsPayload) =>
    api.put<ApiResponse<{ user: User }>>('/users/me/measurements', payload),

  updatePreferences: (payload: UpdatePreferencesPayload) =>
    api.put<ApiResponse<{ user: User }>>('/users/me/preferences', payload),

  deleteAccount: () =>
    api.delete<ApiResponse<void>>('/users/profile'),
}
