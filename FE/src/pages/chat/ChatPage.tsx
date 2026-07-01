import { useState, useEffect, useRef, useCallback } from 'react'
import { ChatService } from '@/services/chat.api'
import type { Chat, ChatMessage } from '@/types/chat.types'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api.types'

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
      setChatsError('Không thể tải danh sách chat.')
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
    const optimistic: ChatMessage = { role: 'user', content, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, optimistic])
    setSending(true)

    try {
      const res = await ChatService.sendMessage(selectedChat._id, { content })
      const updatedChat = res.data.data.chat
      setMessages(updatedChat.messages ?? [])
      // Update title in sidebar if changed
      setChats((prev) =>
        prev.map((c) =>
          c._id === updatedChat._id ? { ...c, title: updatedChat.title, updatedAt: updatedChat.updatedAt } : c,
        ),
      )
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
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 72px)',
        background: '#080808',
        overflow: 'hidden',
      }}
    >
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarOpen ? '280px' : '0',
          minWidth: sidebarOpen ? '280px' : '0',
          flexShrink: 0,
          background: '#0d0d0d',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'min-width 0.3s ease, width 0.3s ease',
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            padding: '20px 16px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 28, height: 28, borderRadius: '8px',
                  background: 'linear-gradient(135deg, #e11d48, #9333ea)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px',
                }}
              >
                💬
              </div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>AI Chat</span>
            </div>
          </div>

          <button
            id="chat-btn-new"
            onClick={handleNewChat}
            disabled={creatingChat}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(225,29,72,0.3)',
              background: 'rgba(225,29,72,0.08)',
              color: creatingChat ? 'rgba(255,255,255,0.3)' : '#e11d48',
              fontWeight: 600,
              fontSize: '13px',
              cursor: creatingChat ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!creatingChat) {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(225,29,72,0.15)'
              }
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(225,29,72,0.08)'
            }}
          >
            {creatingChat ? <MiniSpinner /> : '+'}
            New Chat
          </button>
        </div>

        {/* Chat list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {chatsLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <MiniSpinner />
            </div>
          )}
          {chatsError && (
            <p style={{ color: '#fca5a5', fontSize: '13px', textAlign: 'center', padding: '24px 12px' }}>
              {chatsError}
            </p>
          )}
          {!chatsLoading && chats.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '32px 12px' }}>
              Chưa có cuộc trò chuyện nào.
              <br />
              Tạo mới để bắt đầu!
            </p>
          )}
          {chats.map((chat) => (
            <div
              key={chat._id}
              id={`chat-item-${chat._id}`}
              onClick={() => selectChat(chat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                marginBottom: '2px',
                background:
                  selectedChat?._id === chat._id
                    ? 'rgba(225,29,72,0.1)'
                    : 'transparent',
                border: selectedChat?._id === chat._id
                  ? '1px solid rgba(225,29,72,0.2)'
                  : '1px solid transparent',
                transition: 'all 0.15s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (selectedChat?._id !== chat._id) {
                  ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'
                }
                ;(e.currentTarget as HTMLDivElement).querySelector<HTMLButtonElement>('.delete-btn')!.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                if (selectedChat?._id !== chat._id) {
                  ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                }
                ;(e.currentTarget as HTMLDivElement).querySelector<HTMLButtonElement>('.delete-btn')!.style.opacity = '0'
              }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                  background: selectedChat?._id === chat._id
                    ? 'rgba(225,29,72,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px',
                }}
              >
                💬
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    color: selectedChat?._id === chat._id ? '#fff' : 'rgba(255,255,255,0.7)',
                    fontSize: '13px',
                    fontWeight: selectedChat?._id === chat._id ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {chat.title}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '1px' }}>
                  {new Date(chat.updatedAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => handleDeleteChat(chat._id, e)}
                disabled={deletingId === chat._id}
                style={{
                  opacity: 0,
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  padding: '4px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  flexShrink: 0,
                  transition: 'opacity 0.15s, color 0.15s',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#ef4444'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'
                }}
              >
                {deletingId === chat._id ? <MiniSpinner /> : '×'}
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main chat area ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <div
          style={{
            padding: '0 20px',
            height: '60px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
            background: 'rgba(8,8,8,0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <button
            id="chat-btn-toggle-sidebar"
            onClick={() => setSidebarOpen((o) => !o)}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', padding: '6px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#fff')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {selectedChat ? (
            <>
              <div
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e11d48, #9333ea)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', flexShrink: 0,
                }}
              >
                ✨
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{selectedChat.title}</p>
                {selectedChat.topic && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{selectedChat.topic}</p>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>ALTERA AI Chat</p>
          )}
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          {!selectedChat ? (
            <ChatEmptyState onNewChat={handleNewChat} creating={creatingChat} />
          ) : messages.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '48px', opacity: 0.6 }}>💬</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn bên dưới.
              </p>
            </div>
          ) : (
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
              background: '#0d0d0d',
            }}
          >
            {sendError && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginBottom: '10px',
                  color: '#fca5a5',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ⚠️ {sendError}
              </div>
            )}
            <div
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-end',
              }}
            >
              <textarea
                id="chat-input-message"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhắn tin với AI... (Enter để gửi, Shift+Enter xuống dòng)"
                rows={1}
                disabled={sending}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.6,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(225,29,72,0.4)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
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
                style={{
                  width: 44, height: 44, flexShrink: 0,
                  borderRadius: '12px',
                  border: 'none',
                  background:
                    sending || !input.trim()
                      ? 'rgba(255,255,255,0.06)'
                      : 'linear-gradient(135deg, #e11d48, #9333ea)',
                  color: sending || !input.trim() ? 'rgba(255,255,255,0.3)' : '#fff',
                  cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexDirection: 'column',
                }}
              >
                {sending ? (
                  <MiniSpinner />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center', marginTop: '8px', maxWidth: '800px', margin: '8px auto 0' }}>
              AI có thể mắc sai sót. Luôn kiểm tra thông tin quan trọng.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: isUser
            ? 'rgba(255,255,255,0.1)'
            : 'linear-gradient(135deg, #e11d48, #9333ea)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px',
        }}
      >
        {isUser ? '👤' : '✨'}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: '70%',
          background: isUser
            ? 'rgba(255,255,255,0.07)'
            : 'rgba(225,29,72,0.06)',
          border: isUser
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(225,29,72,0.15)',
          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          padding: '12px 16px',
        }}
      >
        <p
          style={{
            color: isUser ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            margin: 0,
          }}
        >
          {message.content}
        </p>
        {message.createdAt && (
          <p
            style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: '11px',
              marginTop: '6px',
              textAlign: isUser ? 'right' : 'left',
            }}
          >
            {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div
        style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #e11d48, #9333ea)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px',
        }}
      >
        ✨
      </div>
      <div
        style={{
          background: 'rgba(225,29,72,0.06)',
          border: '1px solid rgba(225,29,72,0.15)',
          borderRadius: '4px 16px 16px 16px',
          padding: '14px 20px',
          display: 'flex',
          gap: '5px',
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#e11d48',
              animation: `dot-bounce 1.4s ${i * 0.2}s infinite ease-in-out`,
            }}
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
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: '20px', textAlign: 'center',
        padding: '40px 24px',
      }}
    >
      <div
        style={{
          width: 80, height: 80, borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(225,29,72,0.15), rgba(147,51,234,0.15))',
          border: '1px solid rgba(225,29,72,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px',
        }}
      >
        💬
      </div>
      <div>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '22px', marginBottom: '8px' }}>
          Chào mừng đến ALTERA AI Chat
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', maxWidth: '380px', lineHeight: 1.7 }}>
          Trợ lý thời trang AI của bạn. Hỏi bất kỳ điều gì về phong cách, outfit, xu hướng thời trang và nhiều hơn nữa.
        </p>
      </div>
      <button
        id="chat-btn-empty-new"
        onClick={onNewChat}
        disabled={creating}
        style={{
          padding: '12px 28px',
          borderRadius: '12px',
          border: 'none',
          background: creating ? 'rgba(225,29,72,0.3)' : 'linear-gradient(135deg, #e11d48, #9333ea)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '14px',
          cursor: creating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'opacity 0.2s',
        }}
      >
        {creating ? <MiniSpinner /> : null}
        + Tạo cuộc trò chuyện mới
      </button>
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
          maxWidth: '500px', marginTop: '8px',
        }}
      >
        {[
          { icon: '👗', label: 'Gợi ý outfit' },
          { icon: '🛍', label: 'Tư vấn mua sắm' },
          { icon: '✨', label: 'Xu hướng thời trang' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: '16px 12px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniSpinner() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}
