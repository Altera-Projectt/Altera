import { useState, useEffect, useRef, useCallback } from 'react'
import { ChatService } from '@/services/chat.api'
import type { Chat, ChatMessage } from '@/types/chat.types'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api.types'
import {
  Sparkles, MessageSquare, Plus, Menu, Trash2, Send,
  AlertCircle, ShoppingBag, Shirt, Compass, MessagesSquare,
} from 'lucide-react'
import { cn } from '@/utils/cn'

// ── Topic config (no emojis — icon-only, premium) ─────────────────────────

type TopicKey = 'fashion' | 'outfit' | 'style' | 'general'

const TOPICS: {
  value: TopicKey
  label: string
  desc: string
  Icon: React.ComponentType<{ className?: string }>
}[] = [
  { value: 'fashion',  label: 'Tư vấn thời trang',   desc: 'Xu hướng, phong cách, thương hiệu',  Icon: Sparkles },
  { value: 'outfit',   label: 'Gợi ý trang phục',    desc: 'Phối đồ cho dịp cụ thể',             Icon: Shirt },
  { value: 'style',    label: 'Khám phá phong cách',  desc: 'Tìm phong cách phù hợp với bạn',    Icon: Compass },
  { value: 'general',  label: 'Hội thoại chung',      desc: 'Hỏi bất kỳ điều gì',               Icon: MessagesSquare },
]

// ── Quick prompts per topic ────────────────────────────────────────────────

const QUICK_PROMPTS: Record<TopicKey, string[]> = {
  fashion: [
    'Xu hướng thời trang hè 2025 là gì?',
    'Gợi ý outfit đi làm văn phòng?',
    'Cách phối màu trắng và đen?',
  ],
  outfit: [
    'Tôi muốn mặc gì đi dự tiệc tối?',
    'Gợi ý outfit đi date mùa hè?',
    'Mặc gì đi cà phê cuối tuần?',
  ],
  style: [
    'Tôi thích màu tối, phong cách nào hợp?',
    'Streetwear và Minimalist khác nhau thế nào?',
    'Làm sao tìm được phong cách riêng?',
  ],
  general: [
    'Tôi muốn thay đổi phong cách ăn mặc',
    'Món đồ cơ bản nào nên có trong tủ?',
    'Cách bảo quản quần áo đúng cách?',
  ],
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function ChatPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [chats, setChats] = useState<Chat[]>([])
  const [chatsLoading, setChatsLoading] = useState(true)
  const [chatsError, setChatsError] = useState<string | null>(null)

  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const [creatingChat, setCreatingChat] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Topic selected in the empty state before creating a chat
  const [selectedTopic, setSelectedTopic] = useState<TopicKey>('fashion')

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
  const handleNewChat = async (topic: TopicKey = selectedTopic) => {
    setCreatingChat(true)
    try {
      const res = await ChatService.createChat({
        title: 'Cuộc trò chuyện mới',
        topic,
      })
      const newChat = res.data.data.chat
      setChats((prev) => [newChat, ...prev])
      setSelectedChat(newChat)
      setMessages(newChat.messages ?? [])
      setSendError(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch {
      // silently fail
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
  const handleSend = async (overrideText?: string) => {
    const content = (overrideText ?? input).trim()
    if (!content || !selectedChat || sending) return
    setSendError(null)
    setInput('')

    // Optimistically append user message — exact BE shape
    const optimistic: ChatMessage = {
      sender: 'USER',
      text: content,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setSending(true)

    try {
      const res = await ChatService.sendMessage(selectedChat._id, { message: content })
      // BE returns { data: { userMessage, aiMessage } }
      const { userMessage, aiMessage } = res.data.data

      setMessages((prev) => [
        ...prev.filter((m) => m !== optimistic),
        userMessage,
        aiMessage,
      ])

      // Update sidebar title on first message
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
          'flex-shrink-0 flex-col overflow-hidden transition-all duration-300 ease-in-out',
          'border-r border-[var(--color-border)] bg-[var(--color-neutral)]',
          sidebarOpen ? 'w-[280px]' : 'w-0',
        )}
      >
        <div className="flex flex-col h-full w-[280px]">
          {/* Sidebar header */}
          <div className="p-5 pb-4 border-b border-[var(--color-border)] shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-foreground)]/8 text-[var(--color-foreground)] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-[var(--color-foreground)] font-bold text-sm tracking-wide uppercase">
                  Hội thoại
                </span>
              </div>
            </div>

            <button
              id="chat-btn-new"
              onClick={() => handleNewChat()}
              disabled={creatingChat}
              className={cn(
                'w-full py-2.5 px-4 rounded-[var(--radius-md)]',
                'border border-[var(--color-border)] bg-[var(--color-background)]',
                'text-[var(--color-foreground)] font-semibold text-sm cursor-pointer',
                'flex items-center justify-center gap-2',
                'transition-colors hover:bg-[var(--color-foreground)] hover:text-[var(--color-primary-foreground)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {creatingChat ? <MiniSpinner /> : <Plus className="w-4 h-4" />}
              Cuộc trò chuyện mới
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
              <div className="text-[var(--color-muted-foreground)] text-xs text-center py-8 px-3 leading-relaxed">
                Chưa có cuộc hội thoại nào.
                <br />
                Khởi tạo một cuộc trò chuyện mới để bắt đầu.
              </div>
            )}
            {chats.map((chat) => {
              const isSelected = selectedChat?._id === chat._id
              const topicMeta = TOPICS.find((t) => t.value === chat.topic)
              const TopicIcon = topicMeta?.Icon ?? MessageSquare
              return (
                <div
                  key={chat._id}
                  id={`chat-item-${chat._id}`}
                  onClick={() => selectChat(chat)}
                  className={cn(
                    'group flex items-center gap-3 p-3 rounded-[var(--radius-md)] cursor-pointer transition-all relative border',
                    isSelected
                      ? 'bg-[var(--color-foreground)]/8 border-[var(--color-foreground)]/15'
                      : 'bg-transparent border-transparent hover:bg-[var(--color-muted)]',
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-[var(--radius-md)] flex-shrink-0 flex items-center justify-center',
                    isSelected
                      ? 'bg-[var(--color-foreground)] text-[var(--color-primary-foreground)]'
                      : 'bg-[var(--color-background)] text-[var(--color-muted-foreground)]',
                  )}>
                    <TopicIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm truncate',
                      isSelected
                        ? 'text-[var(--color-foreground)] font-semibold'
                        : 'text-[var(--color-muted-foreground)] font-medium',
                    )}>
                      {chat.title}
                    </p>
                    <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5 uppercase tracking-wide">
                      {topicMeta?.label ?? chat.topic}
                    </p>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all focus:opacity-100 disabled:opacity-50"
                    onClick={(e) => handleDeleteChat(chat._id, e)}
                    disabled={deletingId === chat._id}
                    title="Xóa cuộc trò chuyện"
                  >
                    {deletingId === chat._id
                      ? <MiniSpinner className="w-4 h-4" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </aside>

      {/* ── Main chat area ────────────────────────────────────────────────── */}
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
              <div>
                <h2 className="text-[var(--color-foreground)] font-heading font-semibold text-lg leading-tight">
                  {selectedChat.title}
                </h2>
                {selectedChat.topic && (
                  <p className="text-[var(--color-muted-foreground)] text-[10px] uppercase tracking-widest mt-0.5">
                    {TOPICS.find((t) => t.value === selectedChat.topic)?.label ?? selectedChat.topic}
                  </p>
                )}
              </div>
            ) : (
              <h2 className="text-[var(--color-foreground)] font-heading font-semibold text-lg">
                Trợ lý Phong cách
              </h2>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {!selectedChat ? (
            <ChatEmptyState
              selectedTopic={selectedTopic}
              onTopicChange={setSelectedTopic}
              onNewChat={handleNewChat}
              creating={creatingChat}
            />
          ) : messages.length === 0 ? (
            // Quick prompts when a chat exists but has no messages yet
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-[var(--color-muted)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted-foreground)]">
                <MessageSquare className="w-6 h-6 opacity-60" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Bắt đầu cuộc trò chuyện
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Chọn một câu hỏi gợi ý hoặc tự nhập bên dưới
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {(QUICK_PROMPTS[selectedChat.topic as TopicKey] ?? QUICK_PROMPTS.general).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className={cn(
                      'text-sm px-4 py-2 rounded-[var(--radius-md)] border text-left',
                      'border-[var(--color-border)] bg-[var(--color-background)]',
                      'hover:bg-[var(--color-foreground)] hover:text-[var(--color-primary-foreground)] hover:border-[var(--color-foreground)]',
                      'transition-all duration-200',
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-4">
              {messages.map((msg, i) => (
                <MessageBubble key={msg._id ?? i} message={msg} />
              ))}
              {sending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        {selectedChat && (
          <div className="px-6 pb-5 pt-4 border-t border-[var(--color-border)] shrink-0 bg-[var(--color-background)]">
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
                  placeholder="Nhập câu hỏi của bạn..."
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
                  onClick={() => handleSend()}
                  disabled={sending || !input.trim()}
                  className="w-11 h-11 shrink-0 rounded-full bg-[var(--color-foreground)] text-[var(--color-primary-foreground)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 mb-0.5 mr-0.5"
                >
                  {sending ? <MiniSpinner /> : <Send className="w-4 h-4 ml-[-1px]" />}
                </button>
              </div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[var(--color-muted-foreground)] text-center mt-3">
                Trợ lý AI có thể mắc sai sót. Vui lòng kiểm tra thông tin quan trọng.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Inspiration Board ──────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[380px] xl:w-[440px] bg-[var(--color-neutral)] border-l border-[var(--color-border)] shrink-0">
        <div className="h-[72px] px-6 border-b border-[var(--color-border)] flex items-center shrink-0">
          <h3 className="font-heading font-semibold text-sm uppercase tracking-widest text-[var(--color-foreground)]">
            Bảng cảm hứng
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-50">
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <div className="aspect-[3/4] rounded-[var(--radius-lg)] bg-[var(--color-muted)] border border-[var(--color-border)]" />
              <div className="aspect-[3/4] rounded-[var(--radius-lg)] bg-[var(--color-muted)] border border-[var(--color-border)] mt-8" />
            </div>
            <div>
              <p className="font-heading font-semibold text-base text-[var(--color-foreground)]">
                Tuyển chọn dành riêng cho bạn
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-2 leading-relaxed">
                Gợi ý trang phục và moodboard phong cách sẽ hiện ra tại đây.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  // Uses correct BE fields: sender + text
  const isUser = message.sender === 'USER'
  return (
    <div className={cn('flex gap-3 items-start w-full', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* AI avatar — simple geometric, no random icon */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-1 bg-[var(--color-foreground)] text-[var(--color-primary-foreground)] shadow-sm text-[10px] font-bold tracking-widest">
          AI
        </div>
      )}

      {/* Bubble */}
      <div className={cn(
        'max-w-[82%] px-4 py-3',
        isUser
          ? [
              'bg-[var(--color-foreground)] text-[var(--color-primary-foreground)]',
              'rounded-[16px_4px_16px_16px]',
            ]
          : [
              'bg-[var(--color-muted)] text-[var(--color-foreground)]',
              'border border-[var(--color-border)]',
              'rounded-[4px_16px_16px_16px]',
            ],
      )}>
        <div className={cn(
          'text-[14px] leading-7 whitespace-pre-wrap break-words',
          !isUser && 'font-serif',
        )}>
          {message.text}
        </div>
        {message.createdAt && (
          <p className={cn(
            'text-[10px] uppercase tracking-widest mt-2 opacity-50',
            isUser ? 'text-right' : 'text-left',
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
    <div className="flex gap-3 items-start w-full">
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-1 bg-[var(--color-foreground)] text-[var(--color-primary-foreground)] shadow-sm text-[10px] font-bold tracking-widest">
        AI
      </div>
      <div className="bg-[var(--color-muted)] border border-[var(--color-border)] rounded-[4px_16px_16px_16px] px-4 py-4 flex items-center gap-1.5">
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

// ── Chat Empty State — Topic Selector ──────────────────────────────────────

function ChatEmptyState({
  selectedTopic,
  onTopicChange,
  onNewChat,
  creating,
}: {
  selectedTopic: TopicKey
  onTopicChange: (t: TopicKey) => void
  onNewChat: (topic: TopicKey) => void
  creating: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 text-center px-6 max-w-xl mx-auto">
      {/* Wordmark avatar — no random icons */}
      <div className="w-16 h-16 rounded-[var(--radius-lg)] bg-[var(--color-foreground)] text-[var(--color-primary-foreground)] flex items-center justify-center">
        <span className="font-heading font-black text-xs tracking-widest uppercase">AI</span>
      </div>

      <div>
        <h2 className="font-heading font-bold text-2xl text-[var(--color-foreground)] mb-2">
          Trợ lý Phong cách cá nhân
        </h2>
        <p className="text-[var(--color-muted-foreground)] text-sm max-w-md mx-auto leading-relaxed">
          Phân tích phong cách, gợi ý trang phục và xu hướng mới nhất — tất cả trong một cuộc hội thoại.
        </p>
      </div>

      {/* Topic selector — professional, no emoji */}
      <div className="w-full max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-3">
          Chọn chủ đề
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TOPICS.map((topic) => {
            const isActive = selectedTopic === topic.value
            const { Icon } = topic
            return (
              <button
                key={topic.value}
                type="button"
                onClick={() => onTopicChange(topic.value)}
                className={cn(
                  'text-left p-3 rounded-[var(--radius-md)] border transition-all duration-200',
                  'flex flex-col gap-1',
                  isActive
                    ? 'border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-primary-foreground)]'
                    : 'border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-foreground)] hover:border-[var(--color-foreground)]/40',
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-semibold leading-tight">{topic.label}</span>
                </div>
                <p className={cn(
                  'text-[11px] leading-snug',
                  isActive ? 'opacity-70' : 'text-[var(--color-muted-foreground)]',
                )}>
                  {topic.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <button
        id="chat-btn-empty-new"
        onClick={() => onNewChat(selectedTopic)}
        disabled={creating}
        className={cn(
          'px-8 py-3 rounded-[var(--radius-md)]',
          'bg-[var(--color-foreground)] text-[var(--color-primary-foreground)]',
          'font-semibold text-sm flex items-center gap-2',
          'transition-all hover:opacity-85 active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {creating ? <MiniSpinner /> : <Plus className="w-4 h-4" />}
        Bắt đầu hội thoại
      </button>
    </div>
  )
}

// ── MiniSpinner ───────────────────────────────────────────────────────────

function MiniSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-4 h-4 animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}
