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
import { GridLoadingState } from '@/components/ui/LoadingState'
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
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide">AI Stylist</h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Nhập những món đồ bạn đang có để nhận gợi ý outfit từ AI.
        </p>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-8 border-b border-[var(--color-border)]">
        {([
          { key: 'stylist', label: 'AI Stylist', Icon: Sparkles },
          { key: 'history', label: 'Lịch sử', Icon: Clock },
        ] as { key: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[]).map(({ key, label, Icon }) => (
          <button
            key={key}
            id={`outfit-tab-${key}`}
            type="button"
            onClick={() => setTab(key)}
            className={[
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-[var(--color-primary)] text-[var(--color-foreground)]'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── STYLIST TAB ───────────────────────────────────────────────── */}
      {tab === 'stylist' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* Left: Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Items — required section */}
              <fieldset className="border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-4">
                <legend className="px-1 text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                  Đồ bạn đang có
                  <span className="text-xs font-normal text-[var(--color-accent)]">(bắt buộc ít nhất 1)</span>
                </legend>

                <Input
                  id="outfit-input-top"
                  label="👕 Áo đang có"
                  placeholder="VD: Áo thun trắng oversize cotton"
                  value={top}
                  onChange={(e) => setTop(e.target.value)}
                />
                <Input
                  id="outfit-input-bottom"
                  label="👖 Quần đang có"
                  placeholder="VD: Quần baggy đen denim"
                  value={bottom}
                  onChange={(e) => setBottom(e.target.value)}
                />
                <Input
                  id="outfit-input-shoes"
                  label="👟 Giày đang có"
                  placeholder="VD: Giày sneaker trắng Nike"
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
                className="w-full uppercase tracking-wider font-semibold"
              >
                <Sparkles className="h-4 w-4" />
                Nhận gợi ý AI
              </Button>
            </form>
          </div>

          {/* Right: Result */}
          <div className="lg:col-span-3 min-h-[300px]">
            {loading && <GridLoadingState cols={2} className="pt-2" />}

            {!loading && !result && !error && (
              <EmptyState
                icon={Sparkles}
                title="Chờ gợi ý từ AI"
                description="Nhập ít nhất một món đồ bên trái rồi bấm &quot;Nhận gợi ý AI&quot; để bắt đầu."
              />
            )}

            {!loading && result && (
              <div className="space-y-8">
                {/* AI recommendation text */}
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
                    <h2 className="font-heading text-base font-semibold">Gợi ý từ AI Stylist</h2>
                  </div>
                  <p className="text-sm text-[var(--color-foreground)] leading-relaxed whitespace-pre-wrap">
                    {result.recommendation}
                  </p>
                </div>

                {/* Product grid */}
                {(result.products ?? []).length > 0 && (
                  <div>
                    <h3 className="font-heading text-base font-semibold mb-4 flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Sản phẩm gợi ý ({(result.products ?? []).length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {(result.products ?? []).map((product) => (
                        <OutfitProductCard key={product._id} product={product} />
                      ))}
                    </div>
                  </div>
                )}

                {(result.products ?? []).length === 0 && (
                  <EmptyState
                    icon={ShoppingBag}
                    title="Không có sản phẩm"
                    description="AI không tìm thấy sản phẩm phù hợp lần này. Thử điều chỉnh yêu cầu."
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ───────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div>
          {historyLoading && <GridLoadingState cols={2} />}

          {!historyLoading && historyError && (
            <ErrorState message={historyError} onRetry={fetchHistory} />
          )}

          {!historyLoading && !historyError && (history ?? []).length === 0 && (
            <EmptyState
              icon={Clock}
              title="Chưa có lịch sử"
              description="Hãy thử AI Stylist để nhận gợi ý outfit đầu tiên của bạn!"
              actionLabel="Thử ngay"
              onAction={() => setTab('stylist')}
            />
          )}

          {!historyLoading && !historyError && (history ?? []).length > 0 && (
            <div className="space-y-6">
              {(history ?? []).map((item, idx) => (
                <div
                  key={item._id ?? idx}
                  className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6"
                >
                  {/* Timestamp */}
                  <p className="text-xs text-[var(--color-muted-foreground)] mb-3">
                    {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  {/* Recommendation text */}
                  <p className="text-sm text-[var(--color-foreground)] leading-relaxed mb-4">
                    {item.recommendation}
                  </p>

                  {/* Products mini-grid */}
                  {(item.products ?? []).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {(item.products ?? []).map((p) => (
                        <HistoryProductMini key={p._id} product={p} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
