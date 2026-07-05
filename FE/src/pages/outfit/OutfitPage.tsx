import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Clock, ShoppingBag, AlertCircle } from 'lucide-react'
import { OutfitService } from '@/services/outfit.api'
import type {
  OutfitRecommendation,
  OutfitRecommendPayload,
  OutfitHistoryItem,
  OutfitProduct,
} from '@/types/outfit.types'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatPrice } from '@/utils/format'

// ── Constants ────────────────────────────────────────────────────────────────

type Tab = 'stylist' | 'history'

const OCCASIONS = ['casual', 'formal', 'sporty', 'party', 'business', 'date', 'beach', 'travel']
const STYLES = [
  'Streetwear',
  'Minimalist',
  'Classic',
  'Boho',
  'Preppy',
  'Athleisure',
  'Y2K',
  'Vintage',
  'Techwear',
  'Smart Casual',
]

// ── Component ────────────────────────────────────────────────────────────────

export function OutfitPage() {
  const [tab, setTab] = useState<Tab>('stylist')

  // ── Form ──────────────────────────────────────────────────────────────────
  const [top, setTop] = useState('')
  const [bottom, setBottom] = useState('')
  const [shoes, setShoes] = useState('')
  const [occasion, setOccasion] = useState('')
  const [style, setStyle] = useState('')
  const [budget, setBudget] = useState('')
  const [preferences, setPreferences] = useState('')

  // ── Recommendation ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OutfitRecommendation | null>(null)

  // ── History ───────────────────────────────────────────────────────────────
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [history, setHistory] = useState<OutfitHistoryItem[]>([])

  // ── Fetch history ─────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const res = await OutfitService.getHistory()
      setHistory(res.data.data.history ?? [])
    } catch {
      setHistoryError('Không thể tải lịch sử. Vui lòng thử lại.')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'history') fetchHistory()
  }, [tab, fetchHistory])

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const hasItem = top.trim() || bottom.trim() || shoes.trim()
    if (!hasItem) {
      setError('Vui lòng nhập ít nhất một món đồ (áo, quần hoặc giày) để AI có thể gợi ý.')
      return
    }

    const payload: OutfitRecommendPayload = {}
    if (top.trim()) payload.top = top.trim()
    if (bottom.trim()) payload.bottom = bottom.trim()
    if (shoes.trim()) payload.shoes = shoes.trim()
    if (occasion) payload.occasion = occasion
    if (style) payload.style = style
    if (budget !== '') payload.budget = Number(budget)
    if (preferences.trim()) payload.preferences = preferences.trim()

    try {
      setLoading(true)
      setError(null)
      const response = await OutfitService.getRecommendation(payload)
      setResult(response.data.data)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message ?? 'Đã có lỗi xảy ra, vui lòng thử lại.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-var(--spacing-navbar,72px))] bg-[var(--color-background)] overflow-hidden">
      
      {/* ── LEFT SIDE: Styling Brief ───────────────────────────────────── */}
      <div className="w-full lg:w-[450px] xl:w-[500px] flex flex-col border-r border-[var(--color-border)] bg-[var(--color-background)] shrink-0 h-full relative z-10">
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          
          {/* ── Page Header ───────────────────────────────────────────────── */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold uppercase tracking-widest text-[var(--color-foreground)]">Trợ lý Phong cách</h1>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)] leading-relaxed">
              Nhập những món đồ bạn đang có. AI sẽ phác thảo một bộ trang phục hoàn chỉnh dành riêng cho bạn.
            </p>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="flex gap-1 mb-8 border-b border-[var(--color-border)]">
            {([
              { key: 'stylist', label: 'Phác thảo phong cách', Icon: Sparkles },
              { key: 'history', label: 'Lịch sử tư vấn', Icon: Clock },
            ] as { key: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[]).map(({ key, label, Icon }) => (
              <button
                key={key}
                id={`outfit-tab-${key}`}
                type="button"
                onClick={() => setTab(key)}
                className={[
                  'flex items-center gap-2 px-4 py-3 text-sm font-semibold tracking-wider uppercase transition-colors',
                  tab === key
                    ? 'border-b-2 border-[var(--color-foreground)] text-[var(--color-foreground)]'
                    : 'border-b-2 border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ── STYLIST TAB (Left content) ────────────────────────────────── */}
          {tab === 'stylist' && (
            <form onSubmit={handleSubmit} className="space-y-8 pb-10">

              {/* Items — required section */}
              <fieldset className="border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-4">
                <legend className="px-1 text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                  Đồ bạn đang có
                  <span className="text-xs font-normal text-[var(--color-accent)]">(bắt buộc ít nhất 1)</span>
                </legend>

                <Input
                  id="outfit-input-top"
                  label="Áo đang có"
                  placeholder="VD: Áo thun trắng oversize cotton"
                  value={top}
                  onChange={(e) => setTop(e.target.value)}
                />
                <Input
                  id="outfit-input-bottom"
                  label="Quần đang có"
                  placeholder="VD: Quần baggy đen denim"
                  value={bottom}
                  onChange={(e) => setBottom(e.target.value)}
                />
                <Input
                  id="outfit-input-shoes"
                  label="Giày đang có"
                  placeholder="VD: Giày sneaker trắng cổ thấp"
                  value={shoes}
                  onChange={(e) => setShoes(e.target.value)}
                />
              </fieldset>

              {/* Preferences — optional section */}
              <fieldset className="border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-4">
                <legend className="px-1 text-sm font-semibold text-[var(--color-foreground)]">
                  Tuỳ chỉnh <span className="text-xs font-normal text-[var(--color-muted-foreground)]">(không bắt buộc)</span>
                </legend>

                <div className="grid grid-cols-2 gap-4">
                  {/* Occasion */}
                  <div className="w-full">
                    <Label htmlFor="outfit-select-occasion">Dịp</Label>
                    <select
                      id="outfit-select-occasion"
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className={[
                        'w-full h-10 px-3 text-sm',
                        'bg-[var(--color-background)] text-[var(--color-foreground)]',
                        'border border-[var(--color-border)] rounded-[var(--radius-md)]',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-transparent',
                        'transition-colors duration-150',
                      ].join(' ')}
                    >
                      <option value="">Chọn dịp...</option>
                      {OCCASIONS.map((o) => (
                        <option key={o} value={o}>
                          {o.charAt(0).toUpperCase() + o.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Style */}
                  <div className="w-full">
                    <Label htmlFor="outfit-select-style">Phong cách</Label>
                    <select
                      id="outfit-select-style"
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className={[
                        'w-full h-10 px-3 text-sm',
                        'bg-[var(--color-background)] text-[var(--color-foreground)]',
                        'border border-[var(--color-border)] rounded-[var(--radius-md)]',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-transparent',
                        'transition-colors duration-150',
                      ].join(' ')}
                    >
                      <option value="">Chọn style...</option>
                      {STYLES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Budget */}
                <Input
                  id="outfit-input-budget"
                  type="number"
                  label="Ngân sách (VNĐ)"
                  placeholder="VD: 500000"
                  min={0}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />

                {/* Preferences textarea */}
                <div className="w-full">
                  <Label htmlFor="outfit-textarea-preferences">Sở thích / Yêu cầu thêm</Label>
                  <textarea
                    id="outfit-textarea-preferences"
                    rows={3}
                    placeholder="VD: Màu tối, phong cách đơn giản, không hoạ tiết..."
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    className={[
                      'w-full px-3 py-2 text-sm',
                      'bg-[var(--color-background)] text-[var(--color-foreground)]',
                      'border border-[var(--color-border)] rounded-[var(--radius-md)]',
                      'placeholder:text-[var(--color-muted-foreground)]',
                      'focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-transparent',
                      'transition-colors duration-150 resize-none',
                    ].join(' ')}
                  />
                </div>
              </fieldset>

              {/* Inline error */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-red-50 px-4 py-3 text-sm text-[var(--color-error)]"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                id="outfit-btn-submit"
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full uppercase tracking-widest font-semibold h-14"
              >
                {!loading && <Sparkles className="h-4 w-4 mr-2" />}
                {loading ? 'Đang phân tích...' : 'Tạo bộ trang phục'}
              </Button>
            </form>
          )}

          {/* ── HISTORY TAB (Left content) ────────────────────────────────── */}
          {tab === 'history' && (
            <div className="pb-10">
              {historyLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 w-full bg-zinc-200 animate-pulse rounded-[var(--radius-lg)] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
                  ))}
                </div>
              )}

              {!historyLoading && historyError && (
                <ErrorState message={historyError} onRetry={fetchHistory} />
              )}

              {!historyLoading && !historyError && (history ?? []).length === 0 && (
                <EmptyState
                  icon={Clock}
                  title="Chưa có lịch sử tư vấn"
                  description="Các bộ trang phục được tư vấn sẽ được lưu lại tại đây."
                  actionLabel="Bắt đầu phác thảo"
                  onAction={() => setTab('stylist')}
                />
              )}

              {!historyLoading && !historyError && (history ?? []).length > 0 && (
                <div className="space-y-4">
                  {(history ?? []).map((item, idx) => (
                    <button
                      key={item._id ?? idx}
                      onClick={() => setResult(item as unknown as OutfitRecommendation)}
                      className="w-full text-left rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-neutral)] p-4 transition-colors"
                    >
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-[var(--color-foreground)] line-clamp-2 font-serif">
                        {item.recommendation}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDE: Inspiration Board ──────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[var(--color-neutral)] h-full overflow-y-auto relative">
        <div className="p-6 lg:p-12 max-w-5xl mx-auto w-full">
          {tab === 'stylist' && loading && (
            <div className="animate-in fade-in duration-500 pt-10">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="h-5 w-5 text-[var(--color-foreground)] animate-pulse" />
                <h2 className="font-heading text-xl uppercase tracking-widest">Đang phác thảo bộ trang phục...</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-4">
                    <div className="aspect-[3/4] w-full rounded-[var(--radius-lg)] bg-zinc-200 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
                    <div className="h-4 w-2/3 bg-zinc-200 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
                    <div className="h-4 w-1/3 bg-zinc-200 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !result && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center py-32 opacity-50">
              <Sparkles className="w-12 h-12 mb-6 text-[var(--color-muted-foreground)]" />
              <h2 className="font-heading text-2xl uppercase tracking-widest text-[var(--color-foreground)] mb-2">Bảng cảm hứng</h2>
              <p className="text-sm text-[var(--color-muted-foreground)] max-w-sm mx-auto">
                Hoàn thiện phần phác thảo để xem bộ sưu tập được tuyển chọn riêng cho bạn.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700 fade-in pt-4">
              {/* AI recommendation text */}
              <div>
                <h2 className="font-heading text-3xl mb-4 font-normal tracking-wide">Bộ trang phục của bạn</h2>
                <div className="pl-6 border-l border-[var(--color-foreground)] py-2">
                  <p className="text-lg font-serif text-[var(--color-foreground)] leading-relaxed whitespace-pre-wrap">
                    {result.recommendation}
                  </p>
                </div>
              </div>

              {/* Product grid */}
              {(result.products ?? []).length > 0 && (
                <div>
                  <h3 className="font-heading text-sm uppercase tracking-widest font-semibold mb-6 flex items-center gap-2 text-[var(--color-muted-foreground)]">
                    Featured Pieces
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(result.products ?? []).map((product) => (
                      <OutfitProductCard key={product._id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              {(result.products ?? []).length === 0 && (
                <EmptyState
                  icon={ShoppingBag}
                  title="Không tìm thấy sản phẩm phù hợp"
                  description="AI chưa tìm được sản phẩm phù hợp lần này. Hãy dùng gợi ý phía trên làm cảm hứng."
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── OutfitProductCard ─────────────────────────────────────────────────────────
// Local card — outfit products use `images[]` not `imageUrl`, so we cannot
// reuse the fashion/ProductCard which expects `product.imageUrl`.

function OutfitProductCard({ product }: { product: OutfitProduct }) {
  const imgSrc = (product.images ?? [])[0] ?? null

  return (
    <div className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] transition-shadow hover:shadow-[var(--shadow-md)]">
      {/* Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-muted)]">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-muted-foreground)]">
            Không có ảnh
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-[var(--color-background)] px-3 py-1 text-xs font-semibold text-[var(--color-foreground)]">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)] mb-1">
          {product.category}
        </p>
        <h4 className="text-sm font-semibold text-[var(--color-foreground)] line-clamp-2 mb-1">
          {product.name}
        </h4>
        <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2 mb-3">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm font-bold text-[var(--color-foreground)]">
            {formatPrice(product.price)}
          </span>
          {product.stock > 0 && (
            <span className="text-xs text-[var(--color-muted-foreground)]">
              Còn {product.stock}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── HistoryProductMini ────────────────────────────────────────────────────────

function HistoryProductMini({ product }: { product: OutfitProduct }) {
  const imgSrc = (product.images ?? [])[0] ?? null

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)]">
      <div className="aspect-square w-full overflow-hidden bg-[var(--color-muted)]">
        {imgSrc ? (
          <img src={imgSrc} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-muted-foreground)]">
            No image
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium line-clamp-1 text-[var(--color-foreground)]">
          {product.name}
        </p>
        <p className="text-xs font-semibold text-[var(--color-accent)] mt-0.5">
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  )
}
