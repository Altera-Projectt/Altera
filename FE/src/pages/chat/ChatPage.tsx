import { useState, useEffect, useRef, useCallback } from 'react'
import { ChatService } from '@/services/chat.api'
import type { Chat, ChatMessage } from '@/types/chat.types'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api.types'
import { Sparkles, MessageSquare, Plus, X, Menu, Trash2, Send, AlertCircle, ShoppingBag, User } from 'lucide-react'
import { cn } from '@/utils/cn'

export function ChatPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [chats, setChats] = useState<Chat[]>([])
  const [chatsLoading, setChatsLoading] = useState(true)
  const [chatsError, setChatsError] = useState<string | null>(null)

  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [rightPanelOpen, setRightPanelOpen] = useState(true)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const [creatingChat, setCreatingChat] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ── Fetch chat list ───────────────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    setChatsLoading(true)
    setChatsError(null)
    try {
      const res = await ChatService.getChats()
      setChats(res.data.data.chats)
    } catch {
      setChatsError('Không thể tải danh sách hội thoại.')
    } finally {
      setChatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Select chat ───────────────────────────────────────────────────────────
  const selectChat = async (chat: Chat) => {
    if (selectedChat?._id === chat._id) return
    setSelectedChat(chat)
    setSendError(null)
    // Fetch full chat to get messages
    try {
      const res = await ChatService.getChat(chat._id)
      const fullChat = res.data.data.chat
      setSelectedChat(fullChat)
      setMessages(fullChat.messages ?? [])
    } catch {
      setMessages(chat.messages ?? [])
    }
  }

  // ── Create new chat ───────────────────────────────────────────────────────
  const handleNewChat = async () => {
    setCreatingChat(true)
    try {
      const res = await ChatService.createChat({ title: 'New Chat' })
      const newChat = res.data.data.chat
      setChats((prev) => [newChat, ...prev])
      setSelectedChat(newChat)
      setMessages(newChat.messages ?? [])
      setSendError(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch {
      // silently fail – list will be stale until next refresh
    } finally {
      setCreatingChat(false)
    }
  }

  // ── Delete chat ───────────────────────────────────────────────────────────
  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(chatId)
    try {
      await ChatService.deleteChat(chatId)
      setChats((prev) => prev.filter((c) => c._id !== chatId))
      if (selectedChat?._id === chatId) {
        setSelectedChat(null)
        setMessages([])
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = input.trim()
    if (!content || !selectedChat || sending) return
    setSendError(null)
    setInput('')

    // Optimistically append user message
    const optimistic: ChatMessage = { sender: 'USER', text: content, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, optimistic])
    setSending(true)

    try {
      const res = await ChatService.sendMessage(selectedChat._id, { message: content })
      const { userMessage, aiMessage } = res.data.data
      
      // Thay optimistic bằng response thật, thêm aiMessage vào
      setMessages((prev) => [
        ...prev.filter((m) => m !== optimistic),
        userMessage,
        aiMessage,
      ])
      
      // Cập nhật title trong sidebar nếu đây là tin nhắn đầu tiên:
      if (messages.length === 0) {
        setChats((prev) =>
          prev.map((c) =>
            c._id === selectedChat._id
              ? { ...c, title: content.substring(0, 50) }
              : c
          )
        )
      }
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg = axiosErr.response?.data?.message ?? 'Gửi tin nhắn thất bại. Vui lòng thử lại.'
      setSendError(msg)
      // Revert optimistic message
      setMessages((prev) => prev.filter((m) => m !== optimistic))
      setInput(content)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-var(--spacing-navbar,72px))] bg-[var(--color-background)] overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "flex-shrink-0 flex-col overflow-hidden transition-all duration-300 ease-in-out border-r border-[var(--color-border)] bg-[var(--color-neutral)]",
          sidebarOpen ? "w-[280px]" : "w-0"
        )}
      >
        <div className="flex flex-col h-full w-[280px]">
          {/* Sidebar header */}
          <div className="p-5 pb-4 border-b border-[var(--color-border)] shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-[var(--color-foreground)] font-bold text-sm tracking-wide uppercase">AI Chat</span>
              </div>
            </div>

            <button
              id="chat-btn-new"
              onClick={handleNewChat}
              disabled={creatingChat}
              className="w-full py-2.5 px-4 rounded-[var(--radius-md)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 text-[var(--color-accent)] font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 transition-colors hover:bg-[var(--color-accent)]/15 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingChat ? <MiniSpinner /> : <Plus className="w-4 h-4" />}
              New Chat
            </button>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {chatsLoading && (
              <div className="flex justify-center py-8">
                <MiniSpinner className="text-[var(--color-muted-foreground)]" />
              </div>
            )}
            {chatsError && (
              <p className="text-[var(--color-error)] text-sm text-center py-6 px-3">
                {chatsError}
              </p>
            )}
            {!chatsLoading && chats.length === 0 && (
              <div className="text-[var(--color-muted-foreground)] text-sm text-center py-8 px-3">
                Chưa có cuộc hội thoại nào.
                <br />
                Khởi tạo một cuộc trò chuyện mới để bắt đầu.
              </div>
            )}
            {chats.map((chat) => {
              const isSelected = selectedChat?._id === chat._id
              return (
                <div
                  key={chat._id}
                  id={`chat-item-${chat._id}`}
                  onClick={() => selectChat(chat)}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-[var(--radius-md)] cursor-pointer transition-all relative border",
                    isSelected
                      ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)]/20"
                      : "bg-transparent border-transparent hover:bg-[var(--color-muted)]"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-[var(--radius-md)] flex-shrink-0 flex items-center justify-center",
                    isSelected ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]" : "bg-[var(--color-background)] text-[var(--color-muted-foreground)]"
                  )}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm truncate",
                      isSelected ? "text-[var(--color-foreground)] font-semibold" : "text-[var(--color-muted-foreground)] font-medium"
                    )}>
                      {chat.title}
                    </p>
                    <p className="text-[11px] text-[var(--color-muted-foreground)]/70 mt-0.5">
                      {new Date(chat.updatedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <button
                    className="delete-btn opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all focus:opacity-100 disabled:opacity-50"
                    onClick={(e) => handleDeleteChat(chat._id, e)}
                    disabled={deletingId === chat._id}
                    title="Xóa cuộc trò chuyện"
                  >
                    {deletingId === chat._id ? <MiniSpinner className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </aside>

      {/* ── Main chat area (Left) ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-background)] relative">
        {/* Top bar */}
        <div className="h-[72px] px-6 border-b border-[var(--color-border)] flex items-center justify-between shrink-0 bg-[var(--color-background)]/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              id="chat-btn-toggle-sidebar"
              onClick={() => setSidebarOpen((o) => !o)}
              className="p-2 -ml-2 rounded-full text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {selectedChat ? (
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-[var(--color-foreground)] font-heading font-semibold text-lg">{selectedChat.title}</h2>
                  {selectedChat.topic && (
                    <p className="text-[var(--color-muted-foreground)] text-xs uppercase tracking-wider mt-0.5">{selectedChat.topic}</p>
                  )}
                </div>
              </div>
            ) : (
              <h2 className="text-[var(--color-foreground)] font-heading font-semibold text-lg">Trợ lý Phong cách</h2>
            )}
          </div>
          
          {/* Toggle right panel (mobile/tablet only if needed, but we keep it simple here) */}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {!selectedChat ? (
            <ChatEmptyState onNewChat={handleNewChat} creating={creatingChat} />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)]">
                <MessageSquare className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-[var(--color-muted-foreground)] text-sm max-w-sm">
                Bắt đầu hội thoại bằng cách gửi tin nhắn bên dưới.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-4">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {sending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        {selectedChat && (
          <div className="p-6 border-t border-[var(--color-border)] shrink-0 bg-[var(--color-background)]">
            <div className="max-w-3xl mx-auto">
              {sendError && (
                <div className="flex items-center gap-2 mb-3 p-3 rounded-[var(--radius-md)] bg-red-50 text-[var(--color-error)] border border-[var(--color-error)]/20 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {sendError}
                </div>
              )}
              
              <div className="flex items-end gap-3 bg-[var(--color-neutral)] border border-[var(--color-border)] focus-within:border-[var(--color-foreground)] focus-within:ring-1 focus-within:ring-[var(--color-foreground)] rounded-[var(--radius-lg)] p-2 transition-all">
                <textarea
                  id="chat-input-message"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mô tả phong cách bạn đang tìm kiếm..."
                  rows={1}
                  disabled={sending}
                  className="flex-1 bg-transparent border-none text-[var(--color-foreground)] text-sm p-3 outline-none resize-none max-h-[200px] font-sans placeholder:text-[var(--color-muted-foreground)]"
                  onInput={(e) => {
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
                  }}
                />
                <button
                  id="chat-btn-send"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="w-12 h-12 shrink-0 rounded-full bg-[var(--color-foreground)] text-[var(--color-background)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mb-0.5 mr-0.5"
                >
                  {sending ? (
                    <MiniSpinner />
                  ) : (
                    <Send className="w-5 h-5 ml-[-2px]" />
                  )}
                </button>
              </div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[var(--color-muted-foreground)] text-center mt-4">
                Trợ lý AI có thể mắc sai sót. Vui lòng kiểm tra thông tin quan trọng.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Inspiration Board ────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[400px] xl:w-[480px] bg-[var(--color-neutral)] border-l border-[var(--color-border)] shrink-0">
        <div className="h-[72px] px-6 border-b border-[var(--color-border)] flex items-center shrink-0">
          <h3 className="font-heading font-semibold text-base uppercase tracking-wider text-[var(--color-foreground)]">Bảng cảm hứng</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="aspect-[3/4] rounded-[var(--radius-lg)] bg-[var(--color-muted)] border border-[var(--color-border)] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[var(--color-muted-foreground)]" />
              </div>
              <div className="aspect-[3/4] rounded-[var(--radius-lg)] bg-[var(--color-muted)] border border-[var(--color-border)] flex items-center justify-center mt-8">
                <ShoppingBag className="w-6 h-6 text-[var(--color-muted-foreground)]" />
              </div>
            </div>
            <div>
              <p className="font-heading font-semibold text-lg text-[var(--color-foreground)]">Tuyển chọn dành riêng cho bạn</p>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-2">Gợi ý trang phục và moodboard phong cách sẽ hiện ra tại đây.</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === 'USER'
  return (
    <div className={cn("flex gap-4 items-start w-full", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center mt-1 bg-[var(--color-foreground)] text-[var(--color-background)] shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
      )}

      {/* Bubble */}
      <div className={cn(
        "max-w-[85%] rounded-[var(--radius-lg)] p-5",
        isUser 
          ? "bg-[var(--color-foreground)] text-[var(--color-background)] rounded-tr-sm" 
          : "bg-transparent text-[var(--color-foreground)] border-l-2 border-[var(--color-border)] pl-6 py-2 rounded-none"
      )}>
        {/* Render AI text with serif heading for some structure if needed, or just clean prose */}
        <div className={cn(
          "text-[15px] leading-loose whitespace-pre-wrap break-words", 
          !isUser ? "font-serif text-[16px] tracking-wide" : "font-sans"
        )}>
          {message.text}
        </div>
        {message.createdAt && (
          <p className={cn(
            "text-[10px] uppercase tracking-widest mt-3 opacity-60",
            isUser ? "text-right text-[var(--color-background)]" : "text-left text-[var(--color-foreground)]"
          )}>
            {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-4 items-start w-full">
      <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center mt-1 bg-[var(--color-foreground)] text-[var(--color-background)] shadow-sm">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="bg-transparent border-l-2 border-[var(--color-border)] pl-6 py-4 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--color-foreground)]"
            style={{ animation: `dot-bounce 1.4s ${i * 0.2}s infinite ease-in-out` }}
          />
        ))}
        <style>{`
          @keyframes dot-bounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}

function ChatEmptyState({ onNewChat, creating }: { onNewChat: () => void; creating: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 text-center px-6 max-w-2xl mx-auto">
      <div className="w-20 h-20 rounded-[1.5rem] bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)]">
        <Sparkles className="w-10 h-10" />
      </div>
      
      <div>
        <h2 className="font-heading font-bold text-2xl text-[var(--color-foreground)] mb-3">
          Trợ lý Phong cách cá nhân
        </h2>
        <p className="text-[var(--color-muted-foreground)] text-sm max-w-md mx-auto leading-relaxed">
          Phân tích phong cách, gợi ý trang phục và xu hướng mới nhất — tất cả trong một cuộc hội thoại.
        </p>
      </div>
      
      <button
        id="chat-btn-empty-new"
        onClick={onNewChat}
        disabled={creating}
        className="px-6 py-3 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold text-sm flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
      >
        {creating ? <MiniSpinner /> : <Plus className="w-4 h-4" />}
        Khởi tạo hội thoại mới
      </button>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-6">
        {[
          { icon: Sparkles, label: 'Gợi ý trang phục' },
          { icon: ShoppingBag, label: 'Tư vấn mua sắm' },
          { icon: MessageSquare, label: 'Xu hướng mới nhất' },
        ].map((item) => (
          <div
            key={item.label}
            className="p-5 rounded-[var(--radius-lg)] bg-[var(--color-neutral)] border border-[var(--color-border)] text-center flex flex-col items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--color-background)] flex items-center justify-center text-[var(--color-foreground)] shadow-sm">
              <item.icon className="w-5 h-5" />
            </div>
            <p className="text-[var(--color-muted-foreground)] text-xs font-medium">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-4 h-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

