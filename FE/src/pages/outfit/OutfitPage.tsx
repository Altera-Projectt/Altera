import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  StylistService,
  type QuizPayload,
  type QuizResult,
  type RecommendResult,
  type OutfitHistoryItem,
} from '@/services/outfit.api'
import { ColorSwatch } from '@/components/ui/ColorSwatch'
import { formatVND, optimizeCloudinaryUrl } from '@/utils/format'
import {
  ShoppingBag, RotateCcw, ChevronRight, ChevronLeft,
  Shirt, Footprints, Watch, Circle, Clock, Sparkles, CheckCircle2, Wallet,
} from 'lucide-react'

// ── Types & constants ──────────────────────────────────────────────────────

type Step = 'quiz' | 'confirm' | 'result'

// ── Curated Lookbook & Item Illustrations per Style ────────────────────────

type StyleVisualPack = {
  heroLookbook: string
  caption: string
  pieces: {
    top: string
    bottom: string
    shoes: string
    accessories: string
  }
}

const STYLE_VISUAL_GALLERY: Record<string, StyleVisualPack> = {
  Streetwear: {
    heroLookbook: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
    caption: 'Áo thun Boxy 280gsm phối quần Cargo ống rộng & Sneaker Chunky năng động',
    pieces: {
      top: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=500&q=80',
      bottom: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=500&q=80',
      shoes: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=500&q=80',
      accessories: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=500&q=80',
    },
  },
  Minimalist: {
    heroLookbook: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Áo thun trơn Heavyweight form chuẩn phối quần âu ống suông & Sneaker trắng tinh gọn',
    pieces: {
      top: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80',
      bottom: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=500&q=80',
      shoes: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80',
      accessories: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80',
    },
  },
  'Smart Casual': {
    heroLookbook: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=1200&q=80',
    caption: 'Áo thun Polo / Regular Fit lịch lãm kết hợp quần Chinos & Giày Loafer hiện đại',
    pieces: {
      top: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=500&q=80',
      bottom: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=500&q=80',
      shoes: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=500&q=80',
      accessories: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=500&q=80',
    },
  },
  Vintage: {
    heroLookbook: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1200&q=80',
    caption: 'Áo thun Acid Wash / Retro Graphic phối quần Jeans ống đứng hoài cổ',
    pieces: {
      top: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=500&q=80',
      bottom: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=500&q=80',
      shoes: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=500&q=80',
      accessories: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80',
    },
  },
  Sporty: {
    heroLookbook: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Áo thun Dry-Tech thoáng khí phối quần Jogger thể thao & Giày Running',
    pieces: {
      top: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=500&q=80',
      bottom: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=500&q=80',
      shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
      accessories: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=500&q=80',
    },
  },
  'Korean Casual': {
    heroLookbook: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
    caption: 'Áo thun Oversize tông Pastel / Kem sữa phối quần ống rộng chuẩn Hàn Quốc',
    pieces: {
      top: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=500&q=80',
      bottom: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=500&q=80',
      shoes: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80',
      accessories: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=500&q=80',
    },
  },
  Y2K: {
    heroLookbook: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
    caption: 'Áo thun Baby Tee Croptop / Cyber Y2K phối quần Jeans ống loe cá tính',
    pieces: {
      top: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=500&q=80',
      bottom: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=500&q=80',
      shoes: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80',
      accessories: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=500&q=80',
    },
  },
  Elegant: {
    heroLookbook: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1200&q=80',
    caption: 'Áo thun Supima / Polo dệt kim cao cấp phối quần âu & Phụ kiện thanh lịch',
    pieces: {
      top: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=500&q=80',
      bottom: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=500&q=80',
      shoes: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=500&q=80',
      accessories: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80',
    },
  },
  Workwear: {
    heroLookbook: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80',
    caption: 'Áo thun Heavyweight 280gsm bền bỉ phối quần Kaki / Cargo túi hộp & Boots',
    pieces: {
      top: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=500&q=80',
      bottom: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=500&q=80',
      shoes: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=500&q=80',
      accessories: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80',
    },
  },
}

const getStyleVisualPack = (style: string): StyleVisualPack => {
  return STYLE_VISUAL_GALLERY[style] || STYLE_VISUAL_GALLERY.Streetwear
}

const fetchOutfitImage = async (style: string): Promise<string | null> => {
  return getStyleVisualPack(style).heroLookbook
}

const BUDGET_PRESETS: Array<{ label: string; sub: string; value: number }> = [
  { label: 'Tiết kiệm', sub: '≤ 200.000 ₫ / áo', value: 200000 },
  { label: 'Phổ thông', sub: '≤ 260.000 ₫ / áo', value: 260000 },
  { label: 'Độc bản 3D/AI', sub: '≤ 350.000 ₫ / áo', value: 350000 },
  { label: 'Thoải mái', sub: '≥ 500.000 ₫', value: 500000 },
]

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

  // ── Tab ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'quiz' | 'history'>('quiz')

  // ── Step state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('quiz')

  // ── Quiz form ───────────────────────────────────────────────────────────
  const [quizData, setQuizData] = useState<QuizPayload>({
    hobby: '',
    artStyle: '',
    shirtColor: '',
    personality: '',
  })

  // ── Results ─────────────────────────────────────────────────────────────
  const [quizResult, setQuizResult]           = useState<QuizResult | null>(null)
  const [recommendResult, setRecommendResult] = useState<RecommendResult | null>(null)
  const [outfitImage, setOutfitImage]         = useState<string | null>(null)

  // ── History ─────────────────────────────────────────────────────────────
  const [history, setHistory]       = useState<OutfitHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // ── Extra form (confirm step) ───────────────────────────────────────────
  const [gender, setGender]   = useState('unisex')
  const [season, setSeason]   = useState('summer')
  const [budget, setBudget]   = useState<number>(280000)

  // ── Async state ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // ── Cooldown timers ─────────────────────────────────────────────────────
  const [quizCooldown, setQuizCooldown] = useState(0)
  const [recommendCooldown, setRecommendCooldown] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setQuizCooldown((c) => Math.max(0, c - 1))
      setRecommendCooldown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await StylistService.getHistory(1, 20)
      setHistory(res.data.data.history)
    } catch {
      /* silent fail */
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') loadHistory()
  }, [activeTab])

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (quizCooldown > 0) return

    const hasAny = Object.values(quizData).some((v) => v?.toString().trim())
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
      setQuizCooldown(20) // 20 giây cooldown
    }
  }

  const handleRecommend = async () => {
    if (!quizResult || recommendCooldown > 0) return
    try {
      setLoading(true)
      setError(null)
      // Fetch outfit image in parallel
      const [res, img] = await Promise.all([
        StylistService.recommend({
          style: quizResult.style,
          quizResult,
          gender,
          season,
          budget,
          occasion: quizData.hobby, // Map hobby to occasion for backend compatibility
        }),
        fetchOutfitImage(quizResult.style),
      ])
      setRecommendResult(res.data.data)
      setOutfitImage(img)
      setStep('result')
    } catch (err: any) {
      const status = err.response?.status
      if (status === 503) setError('Dịch vụ AI đang bận, vui lòng thử lại sau.')
      else if (status === 400) setError('Thiếu thông tin phong cách, vui lòng làm lại quiz.')
      else setError('Đã có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setLoading(false)
      setRecommendCooldown(20) // 20 giây cooldown
    }
  }

  const handleReset = () => {
    setStep('quiz')
    setQuizData({ hobby: '', artStyle: '', shirtColor: '', personality: '' })
    setQuizResult(null)
    setRecommendResult(null)
    setOutfitImage(null)
    setError(null)
    setGender('unisex')
    setSeason('summer')
    setBudget(280000)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060B16] text-slate-100 font-body pt-32 pb-24">
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6">
        {/* ── Header + Tab switcher ── */}
        <div className="mx-auto max-w-2xl mb-12 text-center">
          <h1 className="font-heading text-5xl md:text-6xl font-black uppercase tracking-normal text-cyan-400 mb-4">
            AI STYLIST
          </h1>
          <p className="text-lg text-slate-400 font-light tracking-normal">
            Trả lời 4 câu hỏi ngắn — AI sẽ phân tích gu thẩm mỹ, gợi ý bản phối minh họa trực quan và đề xuất Áo thun phù hợp ngân sách của bạn.
          </p>

          {/* Tab switcher */}
          <div className="mt-12 flex justify-center gap-8 border-b border-white/20">
            {(['quiz', 'history'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); if (tab === 'quiz') handleReset() }}
                className={`pb-4 px-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab
                    ? 'border-[#00C8FF] text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'quiz' ? 'Quiz phong cách' : 'Lịch sử'}
              </button>
            ))}
          </div>

          {/* Progress bar — only on quiz tab */}
          {activeTab === 'quiz' && (
            <div className="mt-8 flex gap-2">
              {STEPS.map((s, i) => {
                const currentIndex = STEPS.indexOf(step)
                const isActive = i <= currentIndex
                return (
                  <div key={s} className="flex-1">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${
                      isActive ? 'bg-[#00C8FF]' : 'bg-white/10'
                    }`} />
                    <p className={`text-[10px] uppercase tracking-widest mt-3 transition-colors duration-300 ${
                      isActive
                        ? 'text-white font-bold'
                        : 'text-gray-500'
                    }`}>
                      {STEP_LABELS[s]}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      {/* ── Error banner ── */}
      {error && activeTab === 'quiz' && (
        <div className="mx-auto max-w-2xl mb-6 p-3 rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-red-50 text-[var(--color-error)] text-sm">
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: LỊCH SỬ                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="mx-auto max-w-2xl">
          {historyLoading ? (
            <div className="py-16 text-center text-sm text-gray-400 tracking-wide">
              Đang tải lịch sử...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl">
              <Clock className="w-12 h-12 text-[#00C8FF]/50 mx-auto mb-4" />
              <p className="text-lg text-white font-bold mb-2">Chưa có lịch sử</p>
              <p className="text-sm text-gray-400 font-light mb-6">Bạn chưa lưu gợi ý phong cách nào. Thử làm quiz để nhận gợi ý!</p>
              <button
                onClick={() => setActiveTab('quiz')}
                className="px-6 py-3 bg-[#00C8FF]/10 text-[#00C8FF] border border-[#00C8FF]/20 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#00C8FF]/20 transition-colors"
              >
                Làm quiz ngay
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((item) => (
                <div 
                  key={item._id} 
                  className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl hover:border-[#00C8FF]/50 hover:shadow-[0_0_30px_rgba(0,200,255,0.1)] transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#00C8FF] font-bold mb-1">Phong cách</p>
                      <h3 className="font-heading text-2xl font-black uppercase tracking-wide text-white group-hover:text-[#00C8FF] transition-colors">{item.style}</h3>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  
                  {item.aiSuggestion && (
                    <div className="border-l-2 border-[#00C8FF]/30 pl-4 mb-5">
                      <p className="text-sm text-gray-300 font-light leading-relaxed line-clamp-3">
                        {item.aiSuggestion}
                      </p>
                    </div>
                  )}
                  
                  {item.tips?.length > 0 && (
                    <ul className="space-y-2">
                      {item.tips.slice(0, 2).map((tip, i) => (
                        <li key={i} className="text-xs text-gray-400 font-light flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0 mt-1" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 1 — QUIZ                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'quiz' && step === 'quiz' && (
        <div className="mx-auto max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-14 rounded-3xl shadow-2xl">
          <form onSubmit={handleQuizSubmit} className="space-y-10">
            {/* Q1 */}
            <div>
              <label className="block text-sm font-bold text-white uppercase tracking-widest mb-3">
                Sở thích, đam mê hoặc chủ đề bạn yêu thích nhất?
              </label>
              <p className="text-xs text-gray-400 mb-4 font-light">
                Chủ đề graphic bạn muốn thấy trên áo (VD: Bóng đá, Anime, Xe cộ, Câu nói hay...)
              </p>
              <input
                type="text"
                placeholder="VD: Bóng đá, Anime, Ban nhạc rock..."
                value={quizData.hobby}
                onChange={(e) => setQuizData((p) => ({ ...p, hobby: e.target.value }))}
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-5 text-white placeholder-gray-500 outline-none focus:border-[#00C8FF] transition-colors"
              />
            </div>

            {/* Q2 */}
            <div>
              <label className="block text-sm font-bold text-white uppercase tracking-widest mb-3">
                Bạn thích kiểu hình in như thế nào?
              </label>
              <p className="text-xs text-gray-400 mb-4 font-light">
                Gu thẩm mỹ đồ hoạ của bạn (VD: Hình to hầm hố, typo nghệ thuật, tối giản...)
              </p>
              <input
                type="text"
                placeholder="VD: Typo chữ nhỏ tinh tế, Graphic hầm hố sau lưng..."
                value={quizData.artStyle}
                onChange={(e) => setQuizData((p) => ({ ...p, artStyle: e.target.value }))}
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-5 text-white placeholder-gray-500 outline-none focus:border-[#00C8FF] transition-colors"
              />
            </div>

            {/* Q3 */}
            <div>
              <label className="block text-sm font-bold text-white uppercase tracking-widest mb-3">
                Màu áo nền bạn thích nhất?
              </label>
              <p className="text-xs text-gray-400 mb-4 font-light">
                Màu áo giúp bạn tự tin khi mặc (VD: Đen, Trắng, Xám, Đỏ...)
              </p>
              <input
                type="text"
                placeholder="VD: Đen basic, Trắng, Pastel, Màu đất..."
                value={quizData.shirtColor}
                onChange={(e) => setQuizData((p) => ({ ...p, shirtColor: e.target.value }))}
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-5 text-white placeholder-gray-500 outline-none focus:border-[#00C8FF] transition-colors"
              />
            </div>

            {/* Q4 */}
            <div>
              <label className="block text-sm font-bold text-white uppercase tracking-widest mb-3">
                Nếu dùng 3 từ để mô tả cá tính của bạn?
              </label>
              <p className="text-xs text-gray-400 mb-4 font-light">
                Cá tính sẽ quyết định "vibe" của hình in (VD: Năng động, Tối giản, Nổi loạn...)
              </p>
              <input
                type="text"
                placeholder="VD: Hài hước, Năng động, Trầm tính..."
                value={quizData.personality}
                onChange={(e) => setQuizData((p) => ({ ...p, personality: e.target.value }))}
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-5 text-white placeholder-gray-500 outline-none focus:border-[#00C8FF] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || quizCooldown > 0}
              className="w-full bg-gradient-to-b from-[#0011FF] to-[#00C8FF] text-white font-black text-lg h-16 rounded-xl uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center shadow-[0_0_40px_rgba(0,200,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!loading && <ChevronRight className="w-6 h-6 mr-2" />}
              {quizCooldown > 0 ? `VUI LÒNG ĐỢI (${quizCooldown}s)` : 'PHÂN TÍCH PHONG CÁCH'}
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 2 — CONFIRM                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'quiz' && step === 'confirm' && quizResult && (
        <div className="mx-auto max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-14 rounded-3xl shadow-2xl space-y-12">
          {/* Style result section */}
          <div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Phong cách của bạn
                </p>
                <h2 className="font-heading text-4xl md:text-5xl font-black uppercase tracking-normal text-white">
                  {quizResult.style}
                </h2>
              </div>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest bg-[#00C8FF]/20 text-[#00C8FF] px-3 py-1.5 rounded-full h-fit mt-2">
                AI
              </span>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-8 font-light">
              {quizResult.reason}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Color palette */}
              {quizResult.colorPalette?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                    Bảng màu gợi ý
                  </p>
                  <ColorSwatch colors={quizResult.colorPalette} variant="default" />
                </div>
              )}

              {/* Avoid colors */}
              {quizResult.avoidColors?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                    Màu nên tránh
                  </p>
                  <ColorSwatch colors={quizResult.avoidColors} variant="avoid" />
                </div>
              )}
            </div>

            {/* Key pieces */}
            {quizResult.keyPieces?.length > 0 && (
              <div className="mt-8">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                  Món đồ cơ bản cần có
                </p>
                <ul className="space-y-3">
                  {quizResult.keyPieces.map((p) => (
                    <li key={p} className="text-sm text-white flex items-center gap-3 font-light">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00C8FF] shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <hr className="border-white/10" />

          {/* Extra preferences section */}
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white mb-6">
              Tuỳ chỉnh nhu cầu &amp; Ngân sách mua sắm
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Giới tính
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-12 px-4 text-sm rounded-xl border border-blue-400/20 bg-[#0A1122] text-slate-100 focus:outline-none focus:border-cyan-400 transition-colors appearance-none"
                >
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#0F172A] text-slate-100">{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Mùa mặc trong năm
                </label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full h-12 px-4 text-sm rounded-xl border border-blue-400/20 bg-[#0A1122] text-slate-100 focus:outline-none focus:border-cyan-400 transition-colors appearance-none"
                >
                  {SEASON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#0F172A] text-slate-100">{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Budget Section with Presets */}
            <div className="rounded-2xl border border-blue-400/20 bg-[#0A1122] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <label className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest">
                  <Wallet className="w-4 h-4" />
                  Ngân sách dự kiến cho mỗi sản phẩm Áo thun (VNĐ)
                </label>
                <span className="text-sm font-extrabold text-cyan-400">
                  {formatVND(budget)}
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Trên ALTERA, phôi áo thun có giá từ <strong className="text-slate-200">139.000 ₫ – 219.000 ₫</strong> và áo thiết kế độc bản trên Marketplace có giá từ <strong className="text-slate-200">219.000 ₫ – 329.000 ₫</strong>. Chọn nhanh mức ngân sách của bạn:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                {BUDGET_PRESETS.map((preset) => {
                  const active = budget === preset.value
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setBudget(preset.value)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        active
                          ? 'border-cyan-400 bg-[#162038] shadow-md shadow-cyan-500/10'
                          : 'border-blue-400/15 bg-[#0F172A] hover:border-cyan-400/40'
                      }`}
                    >
                      <p className="text-xs font-bold tracking-normal text-slate-100">
                        {preset.label}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-cyan-400">
                        {preset.sub}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={150000}
                  max={800000}
                  step={10000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="flex-1 accent-cyan-400"
                />
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                  min={100000}
                  step={20000}
                  className="w-36 h-10 px-3 text-xs font-bold rounded-xl border border-blue-400/25 bg-[#0F172A] text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10">
            <button
              onClick={() => { setStep('quiz'); setError(null) }}
              disabled={loading}
              className="w-full sm:w-auto px-8 h-14 rounded-xl border border-white/20 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              LÀM LẠI QUIZ
            </button>
            <button
              onClick={handleRecommend}
              disabled={loading || recommendCooldown > 0}
              className="flex-1 bg-gradient-to-b from-[#0011FF] to-[#00C8FF] text-white font-black text-sm md:text-base h-14 rounded-xl uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center shadow-[0_0_20px_rgba(0,200,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              {!loading && <ChevronRight className="w-5 h-5" />}
              {recommendCooldown > 0 ? `ĐỢI (${recommendCooldown}s)` : 'XEM GỢI Ý OUTFIT & SẢN PHẨM'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 3 — KẾT QUẢ                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'quiz' && step === 'result' && recommendResult && (
        <div className="mx-auto max-w-4xl bg-[#0F172A] border border-blue-400/20 p-6 md:p-10 rounded-3xl shadow-2xl space-y-10">
          
          {/* Lookbook Illustration Hero Banner */}
          {(() => {
            const visualPack = getStyleVisualPack(recommendResult.style)
            const heroSrc = outfitImage || visualPack.heroLookbook
            return (
              <div className="w-full aspect-[16/8] overflow-hidden rounded-2xl relative shadow-xl border border-blue-400/20 bg-[#0A1122]">
                <img
                  src={heroSrc}
                  alt={`${recommendResult.style} outfit lookbook`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060B16] via-[#060B16]/45 to-transparent" />
                <div className="absolute bottom-5 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-[#0A1122]/85 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan-400 backdrop-blur-md mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Lookbook Minh Họa Phong Cách
                    </span>
                    <p className="text-slate-100 font-heading text-3xl md:text-4xl font-black uppercase tracking-normal">
                      {recommendResult.style}
                    </p>
                    <p className="mt-1 text-xs md:text-sm text-slate-300">
                      {visualPack.caption}
                    </p>
                  </div>
                  <div className="rounded-xl border border-cyan-400/30 bg-[#0A1122]/90 px-4 py-2.5 text-right backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Ngân sách đã chọn
                    </p>
                    <p className="text-base font-extrabold text-cyan-400">
                      {formatVND(budget)} / sản phẩm
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Section 1 — Tổng quan */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
              Phân tích từ AI Stylist
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-black uppercase tracking-normal text-slate-100 mb-4">
              {recommendResult.style}
            </h2>
            {recommendResult.reason && (
              <p className="text-sm text-slate-300 leading-relaxed mb-5">
                {recommendResult.reason}
              </p>
            )}
            {recommendResult.outfitNote && (
              <div className="rounded-xl border-l-4 border-cyan-400 bg-[#0A1122] p-4">
                <p className="font-body text-sm md:text-base font-normal text-slate-100 leading-relaxed">
                  {recommendResult.outfitNote}
                </p>
              </div>
            )}
          </div>

          <hr className="border-blue-400/15" />

          {/* Section 2 — Bộ outfit hoàn chỉnh kèm Hình ảnh minh họa trực quan */}
          {recommendResult.completeOutfit && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-100">
                    Bộ Outfit Hoàn Chỉnh &amp; Hình Ảnh Minh Họa
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Gợi ý phối đồ 4 món lấy cảm hứng từ phong cách {recommendResult.style} với trọng tâm là Áo thun ALTERA.
                  </p>
                </div>
              </div>

              {(() => {
                const pack = getStyleVisualPack(recommendResult.style)
                const firstRecommendedShirt = recommendResult.recommendedProducts?.[0]
                const topThumb =
                  firstRecommendedShirt?.thumbnail ||
                  firstRecommendedShirt?.imageUrl ||
                  pack.pieces.top
                const outfitCards = [
                  {
                    Icon: Shirt,
                    label: 'Áo thun chủ đạo (ALTERA)',
                    value: recommendResult.completeOutfit.top,
                    image: topThumb,
                    highlight: true,
                  },
                  {
                    Icon: Circle,
                    label: 'Quần / Váy phối kèm',
                    value: recommendResult.completeOutfit.bottom,
                    image: pack.pieces.bottom,
                    highlight: false,
                  },
                  {
                    Icon: Footprints,
                    label: 'Giày đồng điệu',
                    value: recommendResult.completeOutfit.shoes,
                    image: pack.pieces.shoes,
                    highlight: false,
                  },
                  {
                    Icon: Watch,
                    label: 'Phụ kiện tạo điểm nhấn',
                    value: recommendResult.completeOutfit.accessories,
                    image: pack.pieces.accessories,
                    highlight: false,
                  },
                ].filter((r) => r.value)

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {outfitCards.map(({ Icon, label, value, image, highlight }) => (
                      <div
                        key={label}
                        className={`flex flex-col overflow-hidden rounded-2xl border transition-all ${
                          highlight
                            ? 'border-cyan-400/40 bg-[#162038]'
                            : 'border-blue-400/15 bg-[#0A1122]'
                        }`}
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#060B16]">
                          <img
                            src={optimizeCloudinaryUrl(image, 400)}
                            alt={label}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                          <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-md bg-[#060B16]/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400 backdrop-blur-md">
                            <Icon className="h-3 w-3" />
                            {label}
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <p className="text-sm font-semibold tracking-normal text-slate-100 leading-snug">
                            {value}
                          </p>
                          {highlight && (
                            <span className="mt-2 inline-block text-[11px] font-bold text-cyan-400">
                              ★ Sản phẩm trọng tâm tại ALTERA
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

          <hr className="border-blue-400/15" />

          {/* Section 3 — Hướng dẫn màu sắc */}
          {recommendResult.colorGuide && (
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-100 mb-6">
                Hướng dẫn phối màu sắc
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                {[
                  { label: 'Màu chính',     value: recommendResult.colorGuide.main },
                  { label: 'Màu phụ',       value: recommendResult.colorGuide.secondary },
                  { label: 'Màu điểm nhấn', value: recommendResult.colorGuide.accent },
                ].filter((r) => r.value).map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{label}</p>
                    <ColorSwatch colors={[value]} variant="default" size="sm" />
                  </div>
                ))}
                {recommendResult.colorGuide.avoid && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Tránh dùng</p>
                    <ColorSwatch colors={[recommendResult.colorGuide.avoid]} variant="avoid" size="sm" />
                  </div>
                )}
              </div>
              {recommendResult.colorGuide.example && (
                <p className="text-xs text-slate-300 italic bg-[#0A1122] p-4 rounded-xl border border-blue-400/15">
                  {recommendResult.colorGuide.example}
                </p>
              )}
            </div>
          )}

          <hr className="border-blue-400/15" />

          {/* Section 4 — Tips phối đồ */}
          {(recommendResult.tips?.length > 0 || recommendResult.weatherTips || recommendResult.bodyTips) && (
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-100 mb-6">
                Mẹo phối đồ &amp; Lưu ý vóc dáng
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {recommendResult.tips?.length > 0 && (
                  <ul className="space-y-4">
                    {recommendResult.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <span className="w-6 h-6 rounded-full bg-cyan-400/20 text-cyan-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-300 leading-relaxed">{tip}</p>
                      </li>
                    ))}
                  </ul>
                )}
                
                <div className="space-y-6">
                  {recommendResult.weatherTips && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-2">
                        Theo thời tiết
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed bg-[#0A1122] p-4 rounded-xl border border-blue-400/15">
                        {recommendResult.weatherTips}
                      </p>
                    </div>
                  )}
                  {recommendResult.bodyTips && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-2">
                        Theo vóc dáng
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed bg-[#0A1122] p-4 rounded-xl border border-blue-400/15">
                        {recommendResult.bodyTips}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <hr className="border-blue-400/15" />

          {/* Section 5 — Sản phẩm gợi ý kèm hình ảnh & đối chiếu ngân sách */}
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-100">
                  Sản Phẩm Áo Thun &amp; Thiết Kế Đề Xuất Cho Bạn
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Được chọn lọc dựa trên phong cách <strong className="text-cyan-400">{recommendResult.style}</strong> và ngân sách <strong className="text-cyan-400">{formatVND(budget)}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/design')}
                className="rounded-xl border border-cyan-400/35 bg-[#162038] px-4 py-2 text-xs font-bold text-cyan-400 hover:bg-blue-600 hover:text-slate-100 transition"
              >
                Tự thiết kế áo 3D theo style này →
              </button>
            </div>

            {recommendResult.recommendedProducts?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {recommendResult.recommendedProducts.map((product: any, i: number) => {
                  const reasoning = recommendResult.productReasoning?.find(
                    (r) => r.productName === product.name,
                  )
                  return (
                    <RecommendedProductCard
                      key={product._id ?? i}
                      product={product}
                      budget={budget}
                      reason={reasoning?.reason}
                      onNavigate={() => {
                        if (product.isDesign && product.slug) {
                          navigate(`/design/${product.slug}`)
                        } else if (product.isDesign && product._id) {
                          navigate(`/marketplace/${product._id}`)
                        } else {
                          navigate(`/products/${product._id}`)
                        }
                      }}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="text-center bg-[#0A1122] border border-blue-400/15 p-8 rounded-2xl">
                <ShoppingBag className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <p className="text-sm text-slate-200 font-bold mb-1">Chưa tìm thấy sản phẩm</p>
                <p className="text-xs text-slate-400">AI chưa tìm thấy sản phẩm trong kho khớp với phong cách này.</p>
              </div>
            )}
          </div>

          {/* Reset CTA */}
          <div className="flex justify-center pt-6 border-t border-blue-400/15">
            <button
              onClick={handleReset}
              className="px-8 h-12 rounded-full border border-blue-400/25 text-slate-200 font-bold text-xs uppercase tracking-widest hover:bg-[#162038] hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Thử lại với phong cách &amp; ngân sách khác
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

// ── Recommended Product Card with Thumbnail & Budget Indicator ──────────────

function RecommendedProductCard({
  product,
  budget,
  reason,
  onNavigate,
}: {
  product: any
  budget: number
  reason?: string
  onNavigate: () => void
}) {
  const effectivePrice = product.discountPrice ?? product.price ?? 0
  const isWithinBudget = effectivePrice <= budget
  const imageSrc =
    product.thumbnail ||
    product.imageUrl ||
    (Array.isArray(product.images) && product.images[0]) ||
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'

  return (
    <div 
      className="flex flex-col overflow-hidden bg-[#0A1122] border border-blue-400/20 rounded-2xl hover:border-cyan-400 transition-all cursor-pointer group hover:shadow-xl hover:shadow-cyan-500/10"
      onClick={onNavigate}
    >
      {/* Product Image Thumbnail */}
      <div className="relative aspect-[4/4] w-full overflow-hidden bg-[#060B16]">
        <img
          src={optimizeCloudinaryUrl(imageSrc, 480)}
          alt={product.name ?? 'Sản phẩm gợi ý'}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-[#060B16]/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 border border-cyan-400/30 backdrop-blur-md">
            {product.isDesign ? 'Thiết kế Marketplace' : product.category || 'Áo Thun'}
          </span>
        </div>
        <div className="absolute bottom-2.5 right-2.5">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-md ${
              isWithinBudget
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            {isWithinBudget ? 'Trong ngân sách' : 'Gợi ý gần ngân sách'}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col justify-between p-4 gap-3">
        <div>
          <p className="font-heading text-base font-bold tracking-normal text-slate-100 line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors">
            {product.name ?? 'Áo thun ALTERA'}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-extrabold text-cyan-400">
              {formatVND(effectivePrice)}
            </span>
            {product.discountPrice && product.price > product.discountPrice && (
              <span className="text-xs text-slate-500 line-through">
                {formatVND(product.price)}
              </span>
            )}
          </div>
          {reason && (
            <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-3">
              {reason}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-blue-400/10 flex items-center justify-between text-xs font-bold text-cyan-400">
          <span>Xem chi tiết &amp; Chọn Size</span>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  )
}
