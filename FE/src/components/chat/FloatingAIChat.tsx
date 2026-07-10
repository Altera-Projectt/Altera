import { useState, useEffect, useRef } from 'react'
import { ChatService } from '@/services/chat.api'
import type { Chat, ChatMessage } from '@/types/chat.types'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api.types'
import {
  Sparkles, Send,
  AlertCircle, X, Maximize2
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useNavigate } from 'react-router-dom'

export function FloatingAIChat() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [creatingChat, setCreatingChat] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // ── Fetch or Create a Single Chat Session ─────────────────────────────────
  const initChat = async () => {
    setCreatingChat(true)
    try {
      // Create a generic chat session for the floating widget
      const res = await ChatService.createChat({
        title: 'Trợ lý Phong cách',
        topic: 'general',
      })
      const newChat = res.data.data.chat
      setSelectedChat(newChat)
      setMessages(newChat.messages ?? [])
    } catch {
      // silently fail, user can try again
    } finally {
      setCreatingChat(false)
    }
  }

  // Auto-init chat if opening for the first time
  useEffect(() => {
    if (isOpen && !selectedChat && !creatingChat) {
      initChat()
    }
  }, [isOpen])

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (overrideText?: string) => {
    const content = (overrideText ?? input).trim()
    if (!content || !selectedChat || sending) return
    setSendError(null)
    setInput('')

    // Optimistically append user message
    const optimistic: ChatMessage = {
      sender: 'USER',
      text: content,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setSending(true)

    try {
      const res = await ChatService.sendMessage(selectedChat._id, { message: content })
      const { userMessage, aiMessage } = res.data.data

      setMessages((prev) => [
        ...prev.filter((m) => m !== optimistic),
        userMessage,
        aiMessage,
      ])
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* ── Floating Action Button ────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110",
          isOpen ? "bg-[var(--color-muted)] text-[var(--color-foreground)]" : "bg-[var(--color-foreground)] text-[var(--color-primary-foreground)]"
        )}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {/* ── Chat Popover ──────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col w-[360px] h-[520px] max-h-[80vh] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-background)] border border-[var(--color-border)] shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Header */}
          <div className="flex h-[60px] items-center justify-between border-b border-[var(--color-border)] px-4 bg-[var(--color-background)] shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-foreground)] text-[var(--color-primary-foreground)]">
                <span className="font-heading font-black text-[10px] tracking-widest uppercase">AI</span>
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-[var(--color-foreground)] leading-tight">Trợ lý Phong cách</h3>
                <p className="text-[10px] text-emerald-500 font-medium">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  setIsOpen(false)
                  navigate('/chat')
                }}
                className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors rounded-md hover:bg-[var(--color-muted)]"
                title="Mở toàn màn hình"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors rounded-md hover:bg-[var(--color-muted)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[var(--color-muted)]/30">
            {creatingChat ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--color-muted-foreground)]">
                <MiniSpinner className="h-6 w-6" />
                <p className="text-xs">Đang kết nối...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Sparkles className="h-8 w-8 text-[var(--color-muted-foreground)] mb-3 opacity-50" />
                <p className="text-sm font-medium text-[var(--color-foreground)] mb-1">Chào bạn!</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Tôi là Trợ lý AI, tôi có thể tư vấn phong cách, gợi ý phối đồ và giải đáp thắc mắc về thời trang.
                </p>
                <div className="mt-6 flex flex-col gap-2 w-full">
                  {['Gợi ý đồ đi hẹn hò?', 'Mix đồ với áo thun trắng?'].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-foreground)] transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 pb-2">
                {messages.map((msg, i) => (
                  <MessageBubble key={msg._id ?? i} message={msg} />
                ))}
                {sending && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-[var(--color-border)] bg-[var(--color-background)] p-3 shrink-0">
            {sendError && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-md bg-red-50 text-[var(--color-error)] border border-[var(--color-error)]/20 text-[10px]">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {sendError}
              </div>
            )}
            <div className="flex items-center gap-2 bg-[var(--color-muted)] border border-[var(--color-border)] focus-within:border-[var(--color-foreground)] rounded-full px-4 py-1.5 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                disabled={sending || creatingChat}
                className="flex-1 bg-transparent border-none text-[var(--color-foreground)] text-sm py-2 outline-none font-sans placeholder:text-[var(--color-muted-foreground)]"
              />
              <button
                onClick={() => handleSend()}
                disabled={sending || creatingChat || !input.trim()}
                className="w-8 h-8 shrink-0 rounded-full bg-[var(--color-foreground)] text-[var(--color-primary-foreground)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {sending ? <MiniSpinner className="w-3 h-3" /> : <Send className="w-3.5 h-3.5 ml-[-1px]" />}
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === 'USER'
  return (
    <div className={cn('flex gap-2 items-end w-full', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-[var(--color-foreground)] text-[var(--color-primary-foreground)] shadow-sm text-[8px] font-bold tracking-widest mb-1">
          AI
        </div>
      )}
      <div className={cn(
        'max-w-[80%] px-3.5 py-2.5',
        isUser
          ? 'bg-[var(--color-foreground)] text-[var(--color-primary-foreground)] rounded-[16px_16px_4px_16px]'
          : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] rounded-[16px_16px_16px_4px] shadow-sm',
        )}>
        <div className={cn(
          'font-sans text-[13px] leading-relaxed whitespace-pre-wrap break-words',
          isUser ? 'font-medium' : 'font-normal',
        )}>
          {message.text}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end w-full">
      <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-[var(--color-foreground)] text-[var(--color-primary-foreground)] shadow-sm text-[8px] font-bold tracking-widest mb-1">
        AI
      </div>
      <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-[16px_16px_16px_4px] shadow-sm px-3.5 py-3.5 flex items-center gap-1">
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
