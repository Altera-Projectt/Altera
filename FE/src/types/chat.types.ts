export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

export interface Chat {
  _id: string
  userId: string
  title: string
  topic: string
  messages?: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ChatsResponse {
  chats: Chat[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

export interface CreateChatPayload {
  title: string
}

export interface SendMessagePayload {
  content: string
}
