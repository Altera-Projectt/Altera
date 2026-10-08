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
import { formatVND } from '@/utils/format'
import {
  ShoppingBag, RotateCcw, ChevronRight, ChevronLeft,
  Shirt, Footprints, Watch, Circle, Clock,
} from 'lucide-react'

// ── Types & constants ──────────────────────────────────────────────────────

type Step = 'quiz' | 'confirm' | 'result'


// ── Unsplash outfit image helper ──────────────────────────────────────────

const UNSPLASH_STYLE_KEYWORDS: Record<string, string> = {
  'Streetwear':    'streetwear outfit fashion street style',
  'Minimalist':    'minimalist fashion outfit clean aesthetic',
  'Smart Casual':  'smart casual outfit men women fashion',
  'Vintage':       'vintage retro fashion outfit style',
  'Sporty':        'sporty athletic fashion outfit style',
  'Korean Casual': 'korean fashion casual outfit kfashion',
  'Y2K':           'y2k fashion outfit 2000s aesthetic',
  'Elegant':       'elegant fashion outfit formal style',
  'Workwear':      'workwear office outfit business fashion',
}

const fetchOutfitImage = async (style: string): Promise<string | null> => {
  try {
    const keyword = encodeURIComponent(
      UNSPLASH_STYLE_KEYWORDS[style] ?? `${style} fashion outfit`
    )
    // Dùng Unsplash Source API (không cần key, free)
    const url = `https://source.unsplash.com/featured/600x800/?${keyword}`
    return url
  } catch {
    return null
  }
}

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
    favoriteItem: '',
    favoriteColor: '',
    personality: '',
    occasion: '',
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
  const [budget, setBudget]   = useState<number>(800000)

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
          occasion: quizData.occasion,
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
    setQuizData({ favoriteItem: '', favoriteColor: '', personality: '', occasion: '' })
    setQuizResult(null)
    setRecommendResult(null)
    setOutfitImage(null)
    setError(null)
    setGender('unisex')
    setSeason('summer')
    setBudget(800000)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#000B29] text-white font-body pt-32 pb-24">
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6">
        {/* ── Header + Tab switcher ── */}
        <div className="mx-auto max-w-2xl mb-12 text-center">
          <h1 className="font-heading text-5xl md:text-6xl font-black uppercase tracking-tight text-[#00C8FF] mb-4">
            AI STYLIST
          </h1>
          <p className="text-lg text-gray-400 font-light tracking-wide">
            Trả lời 4 câu hỏi ngắn — AI sẽ tìm ra phong cách phù hợp với bạn.
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
                Bạn thường mặc gì khi ra ngoài?
              </label>
              <p className="text-xs text-gray-400 mb-4 font-light">
                Loại trang phục bạn hay chọn nhất trong tuần
              </p>
              <input
                type="text"
                placeholder="VD: áo phông, hoodie, váy, áo khoác..."
                value={quizData.favoriteItem}
                onChange={(e) => setQuizData((p) => ({ ...p, favoriteItem: e.target.value }))}
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-5 text-white placeholder-gray-500 outline-none focus:border-[#00C8FF] transition-colors"
              />
            </div>

            {/* Q2 */}
            <div>
              <label className="block text-sm font-bold text-white uppercase tracking-widest mb-3">
                Màu sắc bạn hay chọn nhất?
              </label>
              <p className="text-xs text-gray-400 mb-4 font-light">
                Tông màu bạn cảm thấy tự tin khi mặc
              </p>
              <input
                type="text"
                placeholder="VD: đen trắng, pastel, màu đất, tone trung tính..."
                value={quizData.favoriteColor}
                onChange={(e) => setQuizData((p) => ({ ...p, favoriteColor: e.target.value }))}
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-5 text-white placeholder-gray-500 outline-none focus:border-[#00C8FF] transition-colors"
              />
            </div>

            {/* Q3 */}
            <div>
              <label className="block text-sm font-bold text-white uppercase tracking-widest mb-3">
                Bạn tự mô tả mình là người như thế nào?
              </label>
              <p className="text-xs text-gray-400 mb-4 font-light">
                Tính cách, lối sống hoặc cá tính của bạn
              </p>
              <input
                type="text"
                placeholder="VD: năng động, bình thường, thích nổi bật, tối giản, cổ điển..."
                value={quizData.personality}
                onChange={(e) => setQuizData((p) => ({ ...p, personality: e.target.value }))}
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-5 text-white placeholder-gray-500 outline-none focus:border-[#00C8FF] transition-colors"
              />
            </div>

            {/* Q4 */}
            <div>
              <label className="block text-sm font-bold text-white uppercase tracking-widest mb-3">
                Bạn thường mặc đồ đi đâu chủ yếu?
              </label>
              <p className="text-xs text-gray-400 mb-4 font-light">
                Dịp hoặc môi trường bạn mặc nhiều nhất
              </p>
              <input
                type="text"
                placeholder="VD: đi học, đi làm văn phòng, đi chơi, đi cafe cuối tuần..."
                value={quizData.occasion}
                onChange={(e) => setQuizData((p) => ({ ...p, occasion: e.target.value }))}
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
                <h2 className="font-heading text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
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
              Tuỳ chỉnh thêm
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Giới tính
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-12 px-4 text-sm rounded-xl border border-white/20 bg-white/10 text-white focus:outline-none focus:border-[#00C8FF] transition-colors appearance-none"
                >
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#000B29] text-white">{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Mùa
                </label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full h-12 px-4 text-sm rounded-xl border border-white/20 bg-white/10 text-white focus:outline-none focus:border-[#00C8FF] transition-colors appearance-none"
                >
                  {SEASON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#000B29] text-white">{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Ngân sách (VND)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  min={0}
                  step={100000}
                  className="w-full h-12 px-4 text-sm rounded-xl border border-white/20 bg-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#00C8FF] transition-colors"
                />
                <p className="text-[10px] text-gray-400 mt-2 font-light tracking-wide">
                  Mức: <span className="font-bold text-white">{formatVND(budget)}</span>
                </p>
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
              {recommendCooldown > 0 ? `ĐỢI (${recommendCooldown}s)` : 'XEM GỢI Ý OUTFIT'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 3 — KẾT QUẢ                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'quiz' && step === 'result' && recommendResult && (
        <div className="mx-auto max-w-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl space-y-12">
          
          {/* Outfit image from Unsplash */}
          {outfitImage && (
            <div className="w-full aspect-[16/7] overflow-hidden rounded-2xl relative shadow-xl border border-white/10">
              <img
                src={outfitImage}
                alt={`${recommendResult.style} outfit inspiration`}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.parentElement!.style.display = 'none' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#000B29] to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-[#00C8FF] text-[10px] font-bold uppercase tracking-widest mb-1">Inspiration</p>
                <p className="text-white font-heading text-3xl font-black uppercase tracking-wide">{recommendResult.style}</p>
              </div>
            </div>
          )}

          {/* Section 1 — Tổng quan */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Phong cách của bạn
            </p>
            <h2 className="font-heading text-4xl font-black uppercase tracking-tight text-white mb-6">
              {recommendResult.style}
            </h2>
            {recommendResult.reason && (
              <p className="text-sm text-gray-300 font-light leading-relaxed mb-6">
                {recommendResult.reason}
              </p>
            )}
            {recommendResult.outfitNote && (
              <div className="border-l-2 border-[#00C8FF] pl-5 py-1">
                <p className="font-body text-base font-normal text-white leading-relaxed">
                  {recommendResult.outfitNote}
                </p>
              </div>
            )}
          </div>

          <hr className="border-white/10" />

          {/* Section 2 — Bộ outfit hoàn chỉnh */}
          {recommendResult.completeOutfit && (
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-white mb-6">
                Bộ outfit hoàn chỉnh
              </p>
              <div className="space-y-4">
                {[
                  { Icon: Shirt,     label: 'Áo',       value: recommendResult.completeOutfit.top },
                  { Icon: Circle,    label: 'Quần / Váy', value: recommendResult.completeOutfit.bottom },
                  { Icon: Footprints,label: 'Giày',     value: recommendResult.completeOutfit.shoes },
                  { Icon: Watch,     label: 'Phụ kiện', value: recommendResult.completeOutfit.accessories },
                ].filter((r) => r.value).map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-5 py-4 border-b border-white/10 last:border-0">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                      <Icon className="w-5 h-5 text-[#00C8FF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                      <p className="text-base text-white font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr className="border-white/10" />

          {/* Section 3 — Hướng dẫn màu sắc */}
          {recommendResult.colorGuide && (
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-white mb-6">
                Hướng dẫn màu sắc
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                {[
                  { label: 'Màu chính',     value: recommendResult.colorGuide.main },
                  { label: 'Màu phụ',       value: recommendResult.colorGuide.secondary },
                  { label: 'Màu điểm nhấn', value: recommendResult.colorGuide.accent },
                ].filter((r) => r.value).map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{label}</p>
                    <ColorSwatch colors={[value]} variant="default" size="sm" />
                  </div>
                ))}
                {recommendResult.colorGuide.avoid && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Tránh dùng</p>
                    <ColorSwatch colors={[recommendResult.colorGuide.avoid]} variant="avoid" size="sm" />
                  </div>
                )}
              </div>
              {recommendResult.colorGuide.example && (
                <p className="text-xs text-gray-400 font-light italic bg-white/5 p-4 rounded-xl border border-white/5">
                  {recommendResult.colorGuide.example}
                </p>
              )}
            </div>
          )}

          <hr className="border-white/10" />

          {/* Section 4 — Tips phối đồ */}
          {(recommendResult.tips?.length > 0 || recommendResult.weatherTips || recommendResult.bodyTips) && (
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-white mb-6">
                Mẹo phối đồ & Lưu ý
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {recommendResult.tips?.length > 0 && (
                  <ul className="space-y-4">
                    {recommendResult.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <span className="w-6 h-6 rounded-full bg-[#00C8FF]/20 text-[#00C8FF] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-300 font-light leading-relaxed">{tip}</p>
                      </li>
                    ))}
                  </ul>
                )}
                
                <div className="space-y-6">
                  {recommendResult.weatherTips && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#00C8FF] mb-2">
                        Theo thời tiết
                      </p>
                      <p className="text-sm text-gray-300 font-light leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                        {recommendResult.weatherTips}
                      </p>
                    </div>
                  )}
                  {recommendResult.bodyTips && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#00C8FF] mb-2">
                        Theo vóc dáng
                      </p>
                      <p className="text-sm text-gray-300 font-light leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                        {recommendResult.bodyTips}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <hr className="border-white/10" />

          {/* Section 5 — Sản phẩm gợi ý */}
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white mb-6">
              Sản phẩm được gợi ý
            </p>
            {recommendResult.recommendedProducts?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendResult.recommendedProducts.map((product: any, i: number) => {
                  const reasoning = recommendResult.productReasoning?.find(
                    (r) => r.productName === product.name,
                  )
                  return (
                    <RecommendedProductCard
                      key={product._id ?? i}
                      product={product}
                      reason={reasoning?.reason}
                      onNavigate={() => {
                        if (product.isDesign && product.slug) {
                          navigate(`/design/${product.slug}`)
                        } else {
                          navigate(`/products/${product._id}`)
                        }
                      }}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="text-center bg-white/5 border border-white/10 p-8 rounded-2xl">
                <ShoppingBag className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-300 font-bold mb-1">Chưa tìm thấy sản phẩm</p>
                <p className="text-xs text-gray-500 font-light">AI chưa tìm thấy sản phẩm trong kho khớp với phong cách này.</p>
              </div>
            )}
          </div>

          {/* Reset CTA */}
          <div className="flex justify-center pt-8 border-t border-white/10">
            <button
              onClick={handleReset}
              className="px-8 h-12 rounded-full border border-white/20 text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Thử lại với phong cách khác
            </button>
          </div>
        </div>
      )}
      </div>
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
    <div 
      className="flex flex-col overflow-hidden bg-white/5 border border-white/10 rounded-2xl hover:border-[#00C8FF] transition-colors cursor-pointer group"
      onClick={onNavigate}
    >
      {/* Image */}
      <div className="aspect-[3/4] bg-white/5 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name ?? 'Sản phẩm'}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <ShoppingBag className="w-10 h-10 opacity-30" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-5">
        <p className="font-heading text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-[#00C8FF] transition-colors">
          {product.name ?? 'Sản phẩm không tên'}
        </p>
        {product.price != null && (
          <p className="text-sm font-bold text-[#00C8FF]">
            {formatVND(product.price)}
          </p>
        )}
        {reason && (
          <p className="text-xs text-gray-400 font-light leading-relaxed line-clamp-3 mt-1">
            {reason}
          </p>
        )}
      </div>
    </div>
  )
}
