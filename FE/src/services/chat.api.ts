import api from '@/utils/axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  Chat,
  ChatsResponse,
  CreateChatPayload,
  SendMessagePayload,
} from '@/types/chat.types'

export const ChatService = {
  getChats: (page = 1, limit = 10) =>
    api.get<ApiResponse<ChatsResponse>>('/chats', { params: { page, limit } }),

  createChat: (payload: CreateChatPayload) =>
    api.post<ApiResponse<{ chat: Chat }>>('/chats', payload),

  getChat: (id: string) =>
    api.get<ApiResponse<{ chat: Chat }>>(`/chats/${id}`),

  sendMessage: (id: string, payload: SendMessagePayload) =>
    api.post<ApiResponse<{ chat: Chat }>>(`/chats/${id}/message`, payload),

  deleteChat: (id: string) =>
    api.delete<ApiResponse<void>>(`/chats/${id}`),

  clearMessages: (id: string) =>
    api.delete<ApiResponse<{ chat: Chat }>>(`/chats/${id}/clear`),
}
