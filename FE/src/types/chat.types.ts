export interface ChatMessage {
  _id?: string
  sender: 'USER' | 'AI'   // matches BE field exactly
  text: string             // matches BE field exactly
  createdAt?: string
  updatedAt?: string
}

export interface Chat {
  _id: string
  userId: string
  title: string
  topic: 'general' | 'fashion' | 'outfit' | 'style'
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
  topic?: 'general' | 'fashion' | 'outfit' | 'style'
}

export interface SendMessagePayload {
  message: string  // matches BE field exactly
}

export interface SendMessageResponse {
  userMessage: ChatMessage
  aiMessage: ChatMessage
}
