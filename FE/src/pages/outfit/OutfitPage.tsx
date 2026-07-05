import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  StylistService,
  type QuizPayload,
  type QuizResult,
  type RecommendResult,
} from '@/services/outfit.api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'
import {
  ShoppingBag, RotateCcw, ChevronRight, ChevronLeft,
  Shirt, Footprints, Watch, Circle,
} from 'lucide-react'
import { formatPrice } from '@/utils/format'

// ── Types & constants ──────────────────────────────────────────────────────

type Step = 'quiz' | 'confirm' | 'result'

const STEPS: Step[] = ['quiz', 'confirm', 'result']

const STEP_LABELS: Record<Step, string> = {
  quiz: 'Trả lời quiz',
  confirm: 'Xác nhận phong cách',
  result: 'Kết quả',
}

const GENDER_OPTIONS = [
  { value: 'unisex', label: 'Unisex' },
  { value: 'male',   label: 'Nam' },
  { value: 'female', label: 'Nữ' },
]

const SEASON_OPTIONS = [
  { value: 'summer', label: 'Mùa hè' },
  { value: 'winter', label: 'Mùa đông' },
  { value: 'spring', label: 'Mùa xuân' },
  { value: 'autumn', label: 'Mùa thu' },
  { value: 'all',    label: 'Quanh năm' },
]

// ── Main Page ──────────────────────────────────────────────────────────────

export function OutfitPage() {
  const navigate = useNavigate()

  // ── Step state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('quiz')

  // ── Quiz form ───────────────────────────────────────────────────────────
  const [quizData, setQuizData] = useState<QuizPayload>({
    favoriteItem: '',
    favoriteColor: '',
    personality: '',
    occasion: '',
  })

  // ── Results ─────────────────────────────────────────────────────────────
  const [quizResult, setQuizResult]         = useState<QuizResult | null>(null)
  const [recommendResult, setRecommendResult] = useState<RecommendResult | null>(null)

  // ── Extra form (confirm step) ───────────────────────────────────────────
  const [gender, setGender]   = useState('unisex')
  const [season, setSeason]   = useState('summer')
  const [budget, setBudget]   = useState<number>(800000)

  // ── Async state ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const hasAny = Object.values(quizData).some((v) => v?.trim())
    if (!hasAny) {
      setError('Vui lòng trả lời ít nhất 1 câu hỏi.')
      return
    }
    try {
      setLoading(true)
      setError(null)
      const res = await StylistService.analyzeQuiz(quizData)
      setQuizResult(res.data.data)
      setStep('confirm')
    } catch (err: any) {
      const status = err.response?.status
      if (status === 503) setError('Dịch vụ AI đang bận, vui lòng thử lại sau.')
      else setError('Đã có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleRecommend = async () => {
    if (!quizResult) return
    try {
      setLoading(true)
      setError(null)
      const res = await StylistService.recommend({
        style: quizResult.style,
        quizResult,
        gender,
        season,
        budget,
        occasion: quizData.occasion,
      })
      setRecommendResult(res.data.data)
      setStep('result')
    } catch (err: any) {
      const status = err.response?.status
      if (status === 503) setError('Dịch vụ AI đang bận, vui lòng thử lại sau.')
      else if (status === 400) setError('Thiếu thông tin phong cách, vui lòng làm lại quiz.')
      else setError('Đã có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep('quiz')
    setQuizData({ favoriteItem: '', favoriteColor: '', personality: '', occasion: '' })
    setQuizResult(null)
    setRecommendResult(null)
    setError(null)
    setGender('unisex')
    setSeason('summer')
    setBudget(800000)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
      {/* ── Header + Progress ── */}
      <div className="mx-auto max-w-2xl mb-10">
        <h1 className="font-heading text-4xl font-normal uppercase tracking-widest">
          AI Stylist
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)] tracking-wide">
          Trả lời 4 câu hỏi ngắn — AI sẽ tìm ra phong cách phù hợp với bạn.
        </p>

        {/* Progress bar */}
        <div className="mt-6 flex gap-1.5">
          {STEPS.map((s, i) => {
            const currentIndex = STEPS.indexOf(step)
            const isActive = i <= currentIndex
            return (
              <div key={s} className="flex-1">
                <div className={cn(
                  'h-0.5 rounded-full transition-all duration-500',
                  isActive ? 'bg-[var(--color-foreground)]' : 'bg-[var(--color-border)]',
                )} />
                <p className={cn(
                  'text-[10px] uppercase tracking-widest mt-1.5 transition-colors duration-300',
                  isActive
                    ? 'text-[var(--color-foreground)] font-semibold'
                    : 'text-[var(--color-muted-foreground)]',
                )}>
                  {STEP_LABELS[s]}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mx-auto max-w-2xl mb-6 p-3 rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-red-50 text-[var(--color-error)] text-sm">
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 1 — QUIZ                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'quiz' && (
        <div className="mx-auto max-w-xl">
          <form onSubmit={handleQuizSubmit} className="space-y-8">

            {/* Q1 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
                Bạn thường mặc gì khi ra ngoài?
              </label>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-2">
                Loại trang phục bạn hay chọn nhất trong tuần
              </p>
              <Input
                placeholder="VD: áo phông, hoodie, váy, áo khoác..."
                value={quizData.favoriteItem}
                onChange={(e) => setQuizData((p) => ({ ...p, favoriteItem: e.target.value }))}
                disabled={loading}
              />
            </div>

            {/* Q2 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
                Màu sắc bạn hay chọn nhất?
              </label>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-2">
                Tông màu bạn cảm thấy tự tin khi mặc
              </p>
              <Input
                placeholder="VD: đen trắng, pastel, màu đất, tone trung tính..."
                value={quizData.favoriteColor}
                onChange={(e) => setQuizData((p) => ({ ...p, favoriteColor: e.target.value }))}
                disabled={loading}
              />
            </div>

            {/* Q3 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
                Bạn tự mô tả mình là người như thế nào?
              </label>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-2">
                Tính cách, lối sống hoặc cá tính của bạn
              </p>
              <Input
                placeholder="VD: năng động, bình thường, thích nổi bật, tối giản, cổ điển..."
                value={quizData.personality}
                onChange={(e) => setQuizData((p) => ({ ...p, personality: e.target.value }))}
                disabled={loading}
              />
            </div>

            {/* Q4 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
                Bạn thường mặc đồ đi đâu chủ yếu?
              </label>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-2">
                Dịp hoặc môi trường bạn mặc nhiều nhất
              </p>
              <Input
                placeholder="VD: đi học, đi làm văn phòng, đi chơi, đi cafe cuối tuần..."
                value={quizData.occasion}
                onChange={(e) => setQuizData((p) => ({ ...p, occasion: e.target.value }))}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full uppercase tracking-widest font-semibold h-14"
              loading={loading}
            >
              {!loading && <ChevronRight className="w-4 h-4 mr-1" />}
              Phân tích phong cách
            </Button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 2 — CONFIRM                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'confirm' && quizResult && (
        <div className="mx-auto max-w-2xl space-y-6">

          {/* Style result card */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
                  Phong cách phù hợp với bạn
                </p>
                <h2 className="font-heading text-3xl font-bold uppercase tracking-wide">
                  {quizResult.style}
                </h2>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs uppercase tracking-widest">
                AI
              </Badge>
            </div>

            <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed mb-6">
              {quizResult.reason}
            </p>

            {/* Color palette */}
            {quizResult.colorPalette?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
                  Bảng màu gợi ý
                </p>
                <div className="flex flex-wrap gap-2">
                  {quizResult.colorPalette.map((c) => (
                    <span
                      key={c}
                      className="px-3 py-1 rounded-full text-xs border border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-foreground)] font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key pieces */}
            {quizResult.keyPieces?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
                  Món đồ cơ bản cần có
                </p>
                <ul className="space-y-1">
                  {quizResult.keyPieces.map((p) => (
                    <li key={p} className="text-sm text-[var(--color-foreground)] flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[var(--color-foreground)] shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Avoid colors */}
            {quizResult.avoidColors?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
                  Màu nên tránh
                </p>
                <div className="flex flex-wrap gap-2">
                  {quizResult.avoidColors.map((c) => (
                    <span key={c} className="text-xs text-[var(--color-error)] opacity-80">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Extra preferences */}
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4">
              Tuỳ chỉnh thêm
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Gender */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">
                  Giới tính
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={cn(
                    'w-full h-10 px-3 text-sm rounded-[var(--radius-md)]',
                    'border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-transparent',
                  )}
                >
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">
                  Mùa
                </label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className={cn(
                    'w-full h-10 px-3 text-sm rounded-[var(--radius-md)]',
                    'border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-transparent',
                  )}
                >
                  {SEASON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5">
                  Ngân sách (VND)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  min={0}
                  step={100000}
                  className={cn(
                    'w-full h-10 px-3 text-sm rounded-[var(--radius-md)]',
                    'border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-transparent',
                  )}
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="md"
              className="gap-2"
              onClick={() => { setStep('quiz'); setError(null) }}
              disabled={loading}
            >
              <ChevronLeft className="w-4 h-4" />
              Làm lại quiz
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1 uppercase tracking-widest font-semibold h-14 gap-2"
              loading={loading}
              onClick={handleRecommend}
            >
              {!loading && <ChevronRight className="w-4 h-4" />}
              Xem gợi ý outfit
            </Button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 3 — KẾT QUẢ                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'result' && recommendResult && (
        <div className="mx-auto max-w-3xl space-y-6">

          {/* Card 1 — Tổng quan */}
          <Card className="p-6">
            <p className="text-xs uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
              Phong cách của bạn
            </p>
            <h2 className="font-heading text-3xl font-bold uppercase tracking-wide mb-4">
              {recommendResult.style}
            </h2>
            {recommendResult.reason && (
              <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed mb-4">
                {recommendResult.reason}
              </p>
            )}
            {recommendResult.outfitNote && (
              <div className="border-l-2 border-[var(--color-border)] pl-4">
                <p className="text-sm text-[var(--color-foreground)] leading-relaxed font-serif">
                  {recommendResult.outfitNote}
                </p>
              </div>
            )}
          </Card>

          {/* Card 2 — Bộ outfit hoàn chỉnh */}
          {recommendResult.completeOutfit && (
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4">
                Bộ outfit hoàn chỉnh
              </p>
              <div className="space-y-3">
                {[
                  { Icon: Shirt,     label: 'Áo',       value: recommendResult.completeOutfit.top },
                  { Icon: Circle,    label: 'Quần / Váy', value: recommendResult.completeOutfit.bottom },
                  { Icon: Footprints,label: 'Giày',     value: recommendResult.completeOutfit.shoes },
                  { Icon: Watch,     label: 'Phụ kiện', value: recommendResult.completeOutfit.accessories },
                ].filter((r) => r.value).map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4 py-3 border-b border-[var(--color-border)] last:border-0">
                    <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-muted)] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)] font-semibold">{label}</p>
                      <p className="text-sm text-[var(--color-foreground)] mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Card 3 — Hướng dẫn màu sắc */}
          {recommendResult.colorGuide && (
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4">
                Hướng dẫn màu sắc
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Màu chính',     value: recommendResult.colorGuide.main },
                  { label: 'Màu phụ',       value: recommendResult.colorGuide.secondary },
                  { label: 'Màu điểm nhấn', value: recommendResult.colorGuide.accent },
                ].filter((r) => r.value).map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-muted-foreground)]">{label}</span>
                    <Badge variant="secondary" className="text-xs">{value}</Badge>
                  </div>
                ))}
                {recommendResult.colorGuide.avoid && (
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                    <span className="text-xs text-[var(--color-muted-foreground)]">Màu nên tránh</span>
                    <span className="text-xs text-[var(--color-error)]">{recommendResult.colorGuide.avoid}</span>
                  </div>
                )}
                {recommendResult.colorGuide.example && (
                  <p className="text-xs text-[var(--color-muted-foreground)] italic pt-2">
                    {recommendResult.colorGuide.example}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Card 4 — Tips phối đồ */}
          {recommendResult.tips?.length > 0 && (
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4">
                Mẹo phối đồ
              </p>
              <ol className="space-y-3">
                {recommendResult.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[var(--color-foreground)] text-[var(--color-primary-foreground)] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-[var(--color-foreground)] leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {/* Card 5 — Thời tiết & Form dáng */}
          {(recommendResult.weatherTips || recommendResult.bodyTips) && (
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4">
                Lưu ý thêm
              </p>
              <div className="space-y-4">
                {recommendResult.weatherTips && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[var(--color-muted-foreground)] mb-1 font-semibold">
                      Theo thời tiết
                    </p>
                    <p className="text-sm text-[var(--color-foreground)] leading-relaxed">
                      {recommendResult.weatherTips}
                    </p>
                  </div>
                )}
                {recommendResult.bodyTips && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[var(--color-muted-foreground)] mb-1 font-semibold">
                      Theo vóc dáng
                    </p>
                    <p className="text-sm text-[var(--color-foreground)] leading-relaxed">
                      {recommendResult.bodyTips}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Card 6 — Sản phẩm gợi ý */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4">
              Sản phẩm được gợi ý
            </p>
            {recommendResult.recommendedProducts?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendResult.recommendedProducts.map((product: any, i: number) => {
                  const reasoning = recommendResult.productReasoning?.find(
                    (r) => r.productName === product.name,
                  )
                  return (
                    <RecommendedProductCard
                      key={product._id ?? i}
                      product={product}
                      reason={reasoning?.reason}
                      onNavigate={() => navigate(`/products/${product._id}`)}
                    />
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon={ShoppingBag}
                title="Chưa tìm thấy sản phẩm phù hợp"
                description="AI chưa tìm thấy sản phẩm trong kho khớp với phong cách này. Bạn có thể xem toàn bộ sản phẩm."
                actionLabel="Xem sản phẩm"
                onAction={() => navigate('/products')}
              />
            )}
          </div>

          {/* Reset CTA */}
          <div className="flex justify-center pt-4 pb-8">
            <Button
              variant="outline"
              size="md"
              className="gap-2"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4" />
              Thử lại với phong cách khác
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Recommended Product Card ────────────────────────────────────────────────

function RecommendedProductCard({
  product,
  reason,
  onNavigate,
}: {
  product: any
  reason?: string
  onNavigate: () => void
}) {
  const imageUrl = product.imageUrl || product.image || null

  return (
    <Card hoverable className="flex flex-col overflow-hidden" onClick={onNavigate}>
      {/* Image */}
      <div className="aspect-[3/4] bg-[var(--color-muted)] relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name ?? 'Sản phẩm'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-muted-foreground)]">
            <ShoppingBag className="w-10 h-10 opacity-30" />
          </div>
        )}
      </div>

      <CardContent className="flex flex-col gap-2 pt-4">
        <p className="font-heading text-sm font-semibold text-[var(--color-foreground)] line-clamp-2 leading-tight">
          {product.name ?? 'Sản phẩm không tên'}
        </p>
        {product.price != null && (
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            {formatPrice(product.price)}
          </p>
        )}
        {reason && (
          <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed line-clamp-2">
            {reason}
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-1 gap-1.5"
          onClick={(e) => { e.stopPropagation(); onNavigate() }}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Xem sản phẩm
        </Button>
      </CardContent>
    </Card>
  )
}
