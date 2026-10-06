import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette,
  Trash2,
  ShoppingBag,
  RotateCcw,
  Wand2,
  RefreshCw,
  BookOpen,
  Plus,
  Download,
  ImagePlus,
  Shirt,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from '@/components/ui/Modal'
import { GridLoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  DesignService,
  type Design,
  type GenerateDesignResponse,
  type UploadedCustomImage,
} from '@/services/design.api'
import { cn } from '@/utils/cn'
import { CustomDesignTab } from '@/components/studio/CustomDesignTab'

// ── Constants ──────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  { value: 'Graphic Art',         label: 'Graphic Art',         hint: 'Vector rõ nét, phù hợp in sắc sảo' },
  { value: 'Vintage Illustration', label: 'Vintage Illustration', hint: 'Nét khắc cổ điển, tone sepia/nâu' },
  { value: 'Streetwear Bold',     label: 'Streetwear Bold',     hint: 'Mảng màu lớn, contrast cao, dễ in' },
  { value: 'Minimalist Line Art', label: 'Minimalist Line Art', hint: 'Nét đơn giản, tinh tế' },
  { value: 'Anime / Manga',       label: 'Anime / Manga',       hint: 'Phong cách Nhật, nhiều chi tiết' },
  { value: 'Watercolor',          label: 'Watercolor',          hint: 'Màu nước, mềm mại' },
  { value: 'Abstract',            label: 'Abstract',            hint: 'Trừa tượng, hình học' },
]
const SHIRT_COLOR_OPTIONS = [
  { label: 'White',  value: 'white',  hex: '#ffffff' },
  { label: 'Black',  value: 'black',  hex: '#111111' },
  { label: 'Navy',   value: 'navy',   hex: '#1e3a5f' },
  { label: 'Grey',   value: 'grey',   hex: '#9ca3af' },
  { label: 'Beige',  value: 'beige',  hex: '#d4b896' },
  { label: 'Cream',  value: 'cream',  hex: '#fffdd0' },
]
const PROMPT_EXAMPLES = [
  'Con đại bàng dang cánh, phong cách vintage',
  'Hoa sen nở, minimalist, đen trắng',
  'Rồng lửa, anime style, màu đỏ cam',
  'Skull với hoa hồng, streetwear bold',
]

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getShirtHex(color: string): string {
  return SHIRT_COLOR_OPTIONS.find((c) => c.value.toLowerCase() === color.toLowerCase())?.hex ?? '#ffffff'
}

function getShirtLabel(colorOrHex: string): string {
  return SHIRT_COLOR_OPTIONS.find((c) => c.value.toLowerCase() === colorOrHex.toLowerCase() || c.hex.toLowerCase() === colorOrHex.toLowerCase())?.label ?? colorOrHex
}

// ── Toast (inline, no extra deps) ──────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'error' }[]>([])
  const counter = useRef(0)
  const show = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = ++counter.current
    setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }
  return { toasts, show }
}

function ToastContainer({ toasts }: { toasts: { id: number; msg: string; type: 'success' | 'error' }[] }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)]',
            'text-sm font-medium shadow-[var(--shadow-lg)]',
            'animate-in slide-in-from-bottom-4 duration-300',
            t.type === 'success'
              ? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
              : 'bg-[var(--color-error)] text-[var(--color-foreground)]',
          )}
        >
          {t.type === 'success' ? '✓' : '✕'} {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── Select helper ──────────────────────────────────────────────────────────

function SelectField({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
        {label}
      </label>
      <select
        className={cn(
          'w-full h-11 px-3 text-sm',
          'bg-[var(--color-card)] text-[var(--color-foreground)]',
          'border border-[var(--color-border)] rounded-[var(--radius-md)]',
          'transition-all duration-200',
          'focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/[0.08]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {children}
      </select>
    </div>
  )
}

// ── Shirt Mockup ───────────────────────────────────────────────────────────

// ── Order Modal ────────────────────────────────────────────────────────────

interface OrderForm {
  fullName: string
  phone: string
  address: string
  city: string
  price: number | string
  note: string
}

function OrderModal({
  open,
  onOpenChange,
  thumbnailUrl,
  onSubmit,
  submitting,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  thumbnailUrl?: string
  onSubmit: (form: OrderForm) => Promise<void>
  submitting: boolean
}) {
  const [form, setForm] = useState<OrderForm>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    price: 299000,
    note: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof OrderForm, string>>>({})

  const set =
    (field: keyof OrderForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.fullName.trim()) errs.fullName = 'Vui lòng nhập họ tên'
    if (!form.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại'
    if (!form.address.trim()) errs.address = 'Vui lòng nhập địa chỉ'
    if (!form.city.trim()) errs.city = 'Vui lòng nhập tỉnh/thành phố'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit(form)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md">
        <ModalHeader>
          <ModalTitle>Xác nhận đặt hàng</ModalTitle>
          <ModalDescription>Nhập thông tin giao hàng để hoàn tất đơn của bạn</ModalDescription>
        </ModalHeader>

        {thumbnailUrl && (
          <div className="mb-4 flex justify-center">
            <img
              src={thumbnailUrl}
              alt="Design thumbnail"
              className="rounded-[var(--radius-md)] object-cover border border-[var(--color-border)]"
              style={{ width: 80, height: 80 }}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Họ và tên"
            required
            placeholder="Nguyễn Văn A"
            value={form.fullName}
            onChange={set('fullName')}
            error={errors.fullName}
          />
          <Input
            label="Số điện thoại"
            required
            type="tel"
            placeholder="0901 234 567"
            value={form.phone}
            onChange={set('phone')}
            error={errors.phone}
          />
          <Input
            label="Địa chỉ"
            required
            placeholder="123 Đường ABC, Quận 1"
            value={form.address}
            onChange={set('address')}
            error={errors.address}
          />
          <Input
            label="Thành phố"
            required
            placeholder="Hồ Chí Minh"
            value={form.city}
            onChange={set('city')}
            error={errors.city}
          />
          <Input
            label="Giá (VND)"
            type="number"
            value={String(form.price)}
            onChange={set('price')}
          />
          <Input
            label="Ghi chú (tuỳ chọn)"
            placeholder="Yêu cầu đặc biệt..."
            value={form.note}
            onChange={set('note')}
          />

          <ModalFooter className="mt-6">
            <ModalClose asChild>
              <Button type="button" variant="ghost" disabled={submitting}>
                Hủy
              </Button>
            </ModalClose>
            <Button type="submit" variant="primary" loading={submitting} className="uppercase tracking-widest font-semibold px-8">
              Xác nhận đặt hàng
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

// ── Generate Form ──────────────────────────────────────────────────────────

interface FormValues {
  prompt: string
  style: string
  shirtColor: string
}

function GenerateForm({
  onGenerate,
  generating,
  cooldown,
  initialValues,
  error,
}: {
  onGenerate: (vals: FormValues) => Promise<void>
  generating: boolean
  cooldown: number
  initialValues?: Partial<FormValues>
  error: string | null
}) {
  const [form, setForm] = useState<FormValues>({
    prompt: initialValues?.prompt ?? '',
    style: initialValues?.style ?? 'Graphic Art',       // default — phù hợp nhất cho print design
    shirtColor: initialValues?.shirtColor ?? 'white',
  })
  const [promptError, setPromptError] = useState('')
  const setField =
    (field: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.prompt.trim()) {
      setPromptError('Vui lòng mô tả hình muốn in')
      return
    }
    setPromptError('')
    await onGenerate(form)
  }

  // The generating state is handled in CreateTab's Central Canvas.

  const currentStyleHint = STYLE_OPTIONS.find((s) => s.value === form.style)?.hint ?? ''

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 border border-[var(--color-error)]/50 bg-[var(--color-error)]/10 text-[var(--color-error)] rounded-[var(--radius-md)] px-3 py-2.5 text-xs">
          <span className="font-semibold">!</span> {error}
        </div>
      )}

      {/* Prompt textarea */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
          Ý tưởng <span className="text-[var(--color-accent)]">*</span>
        </label>
        <textarea
          className={cn(
            'w-full min-h-[120px] px-3 py-2.5 text-sm',
            'bg-[var(--color-card)] text-[var(--color-foreground)]',
            'border rounded-[var(--radius-md)]',
            'placeholder:text-[var(--color-muted-foreground)]/50',
            'transition-all duration-200 resize-none',
            'focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/[0.08]',
            promptError
              ? 'border-[var(--color-error)]/70'
              : 'border-[var(--color-border)]',
          )}
          placeholder="VD: Con đại bàng dang cánh, phong cách vintage..."
          value={form.prompt}
          onChange={setField('prompt')}
          disabled={generating}
        />
        {promptError && (
          <p className="mt-1.5 text-xs text-[var(--color-error)]">{promptError}</p>
        )}
      </div>

      {/* Prompt examples */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Gợi ý</p>
        <div className="flex flex-wrap gap-1.5">
          {PROMPT_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, prompt: example }))}
              className={cn(
                'text-[10px] px-2.5 py-1 rounded-full',
                'border border-[var(--color-border)] bg-white/[0.04] text-[var(--color-muted-foreground)]',
                'hover:bg-white/[0.09] hover:text-[var(--color-foreground)] hover:border-white/20',
                'transition-all duration-150 cursor-pointer',
              )}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Art style */}
      <SelectField
        label="Phong cách"
        value={form.style}
        onChange={setField('style')}
        disabled={generating}
      >
        {STYLE_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </SelectField>
      {currentStyleHint && (
        <p className="-mt-3 text-[10px] text-[var(--color-muted-foreground)] italic">{currentStyleHint}</p>
      )}


      {/* Shirt color swatches */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Màu áo</p>
        <div className="flex gap-2 flex-wrap">
          {SHIRT_COLOR_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              disabled={generating}
              onClick={() => setForm((prev) => ({ ...prev, shirtColor: c.value }))}
              title={c.label}
              className={cn(
                'h-8 w-8 rounded-full transition-all duration-200',
                'ring-1 ring-black/10',
                form.shirtColor === c.value
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--color-background)] scale-110'
                  : 'hover:scale-105 hover:ring-white/40',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      {/* Generate CTA */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={generating}
        disabled={generating || cooldown > 0}
        className="w-full gap-2 uppercase tracking-widest font-bold mt-1"
      >
        {!generating && <Wand2 className="h-4 w-4" />}
        {generating
          ? 'AI đang tạo...'
          : cooldown > 0
          ? `Chờ ${cooldown}s`
          : 'Tạo với AI'}
      </Button>

      {/* Cooldown bar */}
      {cooldown > 0 && !generating && (
        <div>
          <div className="h-0.5 w-full rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full bg-white/60 transition-all duration-1000"
              style={{ width: `${(cooldown / 20) * 100}%` }}
            />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-center text-[var(--color-muted-foreground)] mt-1.5">
            Tạo lại sau {cooldown}s
          </p>
        </div>
      )}
    </form>
  )
}

function ResultControls({
  result,
  isSaved,
  saving,
  refining,
  savedToLibrary,
  savingToLibrary,
  onSave,
  onOrder,
  onRefine,
  onReset,
  onSaveToLibrary,
  onDesignShirt,
}: {
  result: GenerateDesignResponse
  isSaved: boolean
  saving: boolean
  refining: boolean
  savedToLibrary: boolean
  savingToLibrary: boolean
  onSave: () => Promise<void>
  onOrder: () => void
  onRefine: (prompt: string) => Promise<void>
  onReset: () => void
  onSaveToLibrary: () => Promise<void>
  onDesignShirt: () => Promise<void>
}) {
  const [refinePrompt, setRefinePrompt] = useState('')
  const { design } = result

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refinePrompt.trim()) return
    await onRefine(refinePrompt)
    setRefinePrompt('')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Design meta badges */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Thiết kế</p>
        <div className="flex flex-wrap gap-1.5">
          {design.style && <Badge variant="secondary">{design.style}</Badge>}
          {design.shirtType && <Badge variant="secondary">{design.shirtType}</Badge>}
          {design.shirtColor && <Badge variant="secondary" className="capitalize">{getShirtLabel(design.shirtColor)}</Badge>}
        </div>
      </div>

      {/* Refine */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Tinh chỉnh</p>
        <form onSubmit={handleRefineSubmit} className="flex gap-2">
          <input
            className={cn(
              'flex-1 h-11 px-3 text-sm',
              'bg-[var(--color-card)] text-[var(--color-foreground)]',
              'border border-[var(--color-border)] rounded-[var(--radius-md)]',
              'placeholder:text-[var(--color-muted-foreground)]/50',
              'focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/[0.08]',
              'disabled:opacity-40 disabled:cursor-not-allowed transition-all',
            )}
            placeholder="Thêm chi tiết, đổi màu..."
            value={refinePrompt}
            onChange={(e) => setRefinePrompt(e.target.value)}
            disabled={refining}
          />
          <Button type="submit" variant="secondary" size="icon" loading={refining} disabled={refining || !refinePrompt.trim()} aria-label="Tinh chỉnh">
            <RefreshCw className={cn('h-4 w-4', refining && 'animate-spin')} />
          </Button>
        </form>
      </div>

      <div className="pt-4 border-t border-[var(--color-border)] flex flex-col gap-3">
        {/* Use the AI image on a shirt in Custom Design (also saves it to the image library) */}
        <Button
          id="ai-design-shirt"
          variant="primary"
          size="md"
          className="w-full gap-2"
          onClick={onDesignShirt}
          disabled={savingToLibrary}
          loading={savingToLibrary}
        >
          <Shirt className="h-4 w-4" />
          Dùng để thiết kế áo
        </Button>

        {/* Save the AI image into the personal image library used by Custom Design */}
        <Button
          id="ai-save-to-library"
          variant="outline"
          size="md"
          className="w-full gap-2"
          onClick={onSaveToLibrary}
          disabled={savedToLibrary || savingToLibrary}
        >
          <ImagePlus className="h-4 w-4" />
          {savedToLibrary ? '✓ Đã lưu vào thư viện ảnh' : 'Lưu vào thư viện ảnh'}
        </Button>

        {/* Save */}
        <Button
          variant="outline"
          size="md"
          className="w-full gap-2"
          onClick={onSave}
          disabled={isSaved || saving}
          loading={saving}
        >
          {isSaved ? '✓ Đã lưu' : 'Lưu bản thảo'}
        </Button>

        {/* Order */}
        <Button
          variant="primary"
          size="lg"
          className="w-full gap-2 uppercase font-bold tracking-widest"
          onClick={onOrder}
        >
          <ShoppingBag className="h-4 w-4" />
          Đặt hàng ngay
        </Button>

        {/* Reset */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] gap-1.5"
          onClick={onReset}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Tạo thiết kế khác
        </Button>
      </div>
    </div>
  )
}

// ── Design Card (Library) ──────────────────────────────────────────────────

function DesignCard({
  design,
  onReuse,
  onOrder,
  onDelete,
}: {
  design: Design
  onReuse: (d: Design) => void
  onOrder: (d: Design) => void
  onDelete: (id: string) => void
}) {
  const img = design.previewImage || design.customImage
  return (
    <Card hoverable className="flex flex-col">
      <div
        className="w-full bg-[var(--color-muted)] overflow-hidden flex items-center justify-center relative"
        style={{ aspectRatio: '1/1', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}
      >
        {img ? (
          <img
            src={img}
            alt={design.prompt ?? 'Design'}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-muted-foreground)]">
            <Palette className="h-10 w-10 opacity-30" />
          </div>
        )}
      </div>

      <CardContent className="flex flex-col gap-3 pt-4">
        {/* Status + date */}
        <div className="flex items-center justify-between">
          <Badge variant={design.status === 'SAVED' ? 'success' : 'warning'}>
            {design.status}
          </Badge>
          <span className="text-xs text-[var(--color-muted-foreground)]">
            {formatDate(design.createdAt)}
          </span>
        </div>

        {/* Prompt */}
        {design.prompt && (
          <p className="text-sm text-[var(--color-foreground)] line-clamp-2 leading-relaxed">
            {design.prompt}
          </p>
        )}

        {/* Meta */}
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {[design.style, design.shirtType].filter(Boolean).join(' · ')}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1 text-xs"
            onClick={() => onReuse(design)}
          >
            <RotateCcw className="h-3 w-3" />
            Dùng lại
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1 text-xs"
            onClick={async () => {
              const imgUrl = design.previewImage || design.customImage;
              if (imgUrl) {
                try {
                  const response = await fetch(imgUrl);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `design-${design._id}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                } catch (e) {
                  window.open(imgUrl, '_blank');
                }
              }
            }}
          >
            <Download className="h-3 w-3" />
            Tải về
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1 gap-1 text-xs"
            onClick={() => onOrder(design)}
          >
            <ShoppingBag className="h-3 w-3" />
            Đặt hàng
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-error)] hover:bg-red-50"
            onClick={() => {
              if (window.confirm('Bạn có chắc muốn xóa thiết kế này?')) {
                onDelete(design._id)
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── AI Progress Bar ────────────────────────────────────────────────────────

const AI_STATUS_MESSAGES = [
  'Phân tích ý tưởng của bạn…',
  'Chọn bảng màu phù hợp…',
  'Phác thảo bố cục…',
  'Tô màu và thêm chi tiết…',
  'Tinh chỉnh độ nét…',
  'Hoàn thiện artwork…',
  'Kiểm tra chất lượng in…',
  'Sắp hoàn thành…',
]

function AIProgressBar() {
  const [progress, setProgress] = useState(0)
  const [msgIdx, setMsgIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Simulate realistic progress curve
    let current = 0
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          // Stall near the end — wait for real response
          clearInterval(intervalRef.current!)
          return 90
        }
        // Ease-out: fast at start, slows toward 90%
        const remaining = 90 - prev
        const increment = Math.max(0.3, remaining * 0.025)
        current = Math.min(90, prev + increment)
        return current
      })
    }, 400)

    // Rotate status messages
    msgIntervalRef.current = setInterval(() => {
      setMsgIdx((i) => (i + 1) % AI_STATUS_MESSAGES.length)
    }, 3200)

    return () => {
      clearInterval(intervalRef.current!)
      clearInterval(msgIntervalRef.current!)
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-[260px]">
      {/* Status message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.4 }}
          className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40 text-center h-4"
        >
          {AI_STATUS_MESSAGES[msgIdx]}
        </motion.p>
      </AnimatePresence>

      {/* Progress track */}
      <div className="relative w-full h-[3px] rounded-full overflow-hidden bg-white/[0.08]">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.9) 100%)',
            boxShadow: '0 0 8px rgba(255,255,255,0.4)',
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        {/* Shimmer sweep */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Percentage */}
      <p className="text-[10px] font-mono text-white/25">
        {Math.round(progress)}%
      </p>
    </div>
  )
}

// ── Create Tab ─────────────────────────────────────────────────────────────

function CreateTab({
  viewState,
  generating,
  refining,
  saving,
  isSaved,
  currentDesign,
  generateError,
  onGenerate,
  onRefine,
  onSave,
  onOrder,
  onReset,
  initialValues,
  cooldown,
  savedToLibrary,
  savingToLibrary,
  onSaveToLibrary,
  onDesignShirt,
}: {
  viewState: 'form' | 'result'
  generating: boolean
  refining: boolean
  saving: boolean
  isSaved: boolean
  currentDesign: GenerateDesignResponse | null
  generateError: string | null
  onGenerate: (vals: FormValues) => Promise<void>
  onRefine: (prompt: string) => Promise<void>
  onSave: () => Promise<void>
  onOrder: () => void
  onReset: () => void
  initialValues?: Partial<FormValues>
  cooldown: number
  savedToLibrary: boolean
  savingToLibrary: boolean
  onSaveToLibrary: () => Promise<void>
  onDesignShirt: () => Promise<void>
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-0 h-full min-h-[750px] rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">

      {/* ── Fixed Sidebar (300px) ── */}
      <aside className="w-full lg:w-[300px] shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-card)]">
        {/* Sidebar header */}
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-[var(--color-accent)]" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              Creator Tools
            </p>
          </div>
          {viewState === 'result' && currentDesign && (
            <button
              type="button"
              onClick={onReset}
              className="mt-3 text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Tạo lại
            </button>
          )}
        </div>

        {/* Sidebar body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-none">
          <AnimatePresence mode="wait">
            {viewState === 'result' && currentDesign ? (
              <motion.div
                key="result-controls"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <ResultControls
                  result={currentDesign}
                  isSaved={isSaved}
                  saving={saving}
                  refining={refining}
                  onSave={onSave}
                  onOrder={onOrder}
                  onRefine={onRefine}
                  onReset={onReset}
                  savedToLibrary={savedToLibrary}
                  savingToLibrary={savingToLibrary}
                  onSaveToLibrary={onSaveToLibrary}
                  onDesignShirt={onDesignShirt}
                />
              </motion.div>
            ) : (
              <motion.div
                key="generate-form"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <GenerateForm
                  onGenerate={onGenerate}
                  generating={generating}
                  cooldown={cooldown}
                  initialValues={initialValues}
                  error={generateError}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* ── Central Canvas ── */}
      <div className="flex-1 relative bg-[#0d0d0d] flex items-center justify-center p-10 min-h-[550px]">

        {/* ── AI Generation Loading Overlay ── */}
        <AnimatePresence>
          {generating && (
            <motion.div
              key="ai-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-8"
              style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, #0d0d0d 70%)' }}
            >
              {/* Spinner + Pulse rings */}
              <div className="relative flex items-center justify-center">
                {/* Outer pulse ring */}
                <div
                  className="absolute rounded-full border border-white/[0.06]"
                  style={{ width: 160, height: 160, animation: 'ping 2.2s cubic-bezier(0,0,0.2,1) infinite' }}
                />
                {/* Middle ring */}
                <div
                  className="absolute rounded-full border border-white/[0.10]"
                  style={{ width: 120, height: 120, animation: 'ping 2.2s cubic-bezier(0,0,0.2,1) infinite 0.4s' }}
                />
                {/* Spinner track */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 88,
                    height: 88,
                    border: '2px solid rgba(255,255,255,0.07)',
                  }}
                />
                {/* Spinning arc */}
                <svg
                  className="absolute"
                  width={88}
                  height={88}
                  viewBox="0 0 88 88"
                  style={{ animation: 'spin 1.1s linear infinite' }}
                >
                  <circle
                    cx={44} cy={44} r={42}
                    fill="none"
                    stroke="white"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray="60 205"
                    strokeDashoffset={0}
                    opacity={0.85}
                  />
                </svg>
                {/* Center icon */}
                <div
                  className="relative z-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-sm"
                  style={{ width: 56, height: 56 }}
                >
                  <Wand2 className="h-5 w-5 text-white/70" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                </div>
              </div>

              {/* Text block */}
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm font-semibold tracking-wide text-white/80">
                  AI đang tạo thiết kế…
                </p>
                <p className="text-[11px] text-white/35 max-w-[200px] leading-relaxed">
                  Quá trình này có thể mất 30–90 giây, vui lòng đợi
                </p>
              </div>

              {/* Animated progress bar */}
              <AIProgressBar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Generated design ── */}
        <AnimatePresence mode="wait">
          {!generating && viewState === 'result' && currentDesign ? (
            <motion.div
              key={currentDesign.designId}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full flex items-center justify-center"
            >
              <div
                className="relative w-full max-w-[360px] mx-auto rounded-[var(--radius-xl)] shadow-2xl overflow-hidden"
                style={{ aspectRatio: '3/4', backgroundColor: getShirtHex(currentDesign.design.shirtColor ?? 'white') }}
              >
                {/* Collar */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-12 rounded-b-[3rem] border-b-2 border-x-2 border-black/[0.06]" />

                {/* Design image */}
                {(currentDesign.imageUrl || currentDesign.preview || currentDesign.design.customImage || currentDesign.design.previewImage) && (
                  <img
                    src={currentDesign.imageUrl || currentDesign.preview || currentDesign.design.customImage || currentDesign.design.previewImage || ''}
                    alt="Generated design"
                    className="object-contain"
                    style={{ width: '60%', position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)' }}
                  />
                )}

                {/* Status badge */}
                <div className="absolute top-4 right-4">
                  <Badge variant={currentDesign.design.status === 'SAVED' ? 'success' : 'secondary'} className="shadow-sm">
                    {currentDesign.design.status}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ) : !generating ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <div className="h-20 w-20 rounded-full border border-[var(--color-border)] flex items-center justify-center">
                <Palette className="h-8 w-8 text-[var(--color-border)]" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                Canvas trống
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]/60 max-w-[200px]">
                Mô tả ý tưởng và để AI phác thảo cho bạn
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Library Tab ────────────────────────────────────────────────────────────

function LibraryTab({
  designs,
  loading,
  error,
  onReuse,
  onOrder,
  onDelete,
  onRefetch,
  onCreateNew,
}: {
  designs: Design[]
  loading: boolean
  error: string | null
  onReuse: (d: Design) => void
  onOrder: (d: Design) => void
  onDelete: (id: string) => void
  onRefetch: () => void
  onCreateNew: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold">Thiết kế của tôi</h2>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onCreateNew}>
          <Plus className="h-4 w-4" />
          Tạo mới
        </Button>
      </div>

      {loading ? (
        <GridLoadingState cols={3} />
      ) : error ? (
        <div className="border border-[var(--color-error)] bg-red-50 text-[var(--color-error)] rounded-[var(--radius-md)] p-4 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={onRefetch}>Thử lại</Button>
        </div>
      ) : designs.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="Chưa có thiết kế nào"
          description="Hãy tạo thiết kế đầu tiên của bạn"
          actionLabel="Tạo ngay"
          onAction={onCreateNew}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <DesignCard
              key={design._id}
              design={design}
              onReuse={onReuse}
              onOrder={onOrder}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function DesignStudioPage() {
  const navigate = useNavigate()
  const { toasts, show: showToast } = useToast()

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'create' | 'custom' | 'library'>(() => new URLSearchParams(window.location.search).has('draft') ? 'custom' : 'create')
  const [viewState, setViewState] = useState<'form' | 'result'>('form')
  const [generating, setGenerating] = useState(false)
  const [refining, setRefining] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [currentDesign, setCurrentDesign] = useState<GenerateDesignResponse | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderDesignId, setOrderDesignId] = useState<string | null>(null)
  const [orderThumbnail, setOrderThumbnail] = useState<string | undefined>(undefined)
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [myDesigns, setMyDesigns] = useState<Design[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [reuseInitial, setReuseInitial] = useState<Partial<FormValues> | undefined>(undefined)
  // AI image -> personal image library -> Custom Design hand-off
  const [libraryAssetByDesign, setLibraryAssetByDesign] = useState<Record<string, UploadedCustomImage>>({})
  const [savingToLibrary, setSavingToLibrary] = useState(false)
  const [pendingAsset, setPendingAsset] = useState<UploadedCustomImage | null>(null)

  const COOLDOWN_SECONDS = 20
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS)
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGenerate = async (vals: FormValues) => {
    if (cooldown > 0) return
    try {
      setGenerating(true)
      setGenerateError(null)
      const payload = {
        idea: vals.prompt.trim(),
        style: vals.style || 'Graphic Art',
        globalShirtColor: getShirtHex(vals.shirtColor || 'white'),
        printSide: 'Front' as const,
      }
      const res = await DesignService.generateDesign(payload)
      setCurrentDesign(res.data.data)
      setViewState('result')
      setIsSaved(false)
      startCooldown()
    } catch (err: any) {
      const status = err.response?.status
      const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ERR_CANCELED' || err.message?.includes('timeout')

      if (status === 429) {
        setGenerateError('Vui lòng chờ trước khi tạo thiết kế mới.')
        startCooldown()
      } else if (status === 503) {
        setGenerateError('Dịch vụ đang bận, vui lòng thử lại sau ít phút.')
      } else if (status === 400) {
        setGenerateError('Vui lòng mô tả hình muốn in.')
      } else if (isTimeout || (!status && !err.response)) {
        // ── Timeout recovery: The AI may have finished generating but the
        //    HTTP request expired. Poll the library for the latest DRAFT
        //    design created in the last 3 minutes and show it if found.
        try {
          const libRes = await DesignService.getMyDesigns(1, 5)
          const designs = libRes.data.data.designs
          const cutoff = Date.now() - 3 * 60 * 1000 // 3 minutes ago
          const latestDraft = designs.find(
            (d) =>
              d.status === 'DRAFT' &&
              d.prompt?.toLowerCase().includes(vals.prompt.trim().toLowerCase().slice(0, 20)) &&
              new Date(d.createdAt).getTime() > cutoff
          ) ?? designs.find(
            (d) => d.status === 'DRAFT' && new Date(d.createdAt).getTime() > cutoff
          )

          if (latestDraft && (latestDraft.previewImage || latestDraft.customImage)) {
            // Found! Show the newly generated design.
            const syntheticResponse = {
              imageUrl: latestDraft.previewImage || latestDraft.customImage || '',
              preview: latestDraft.previewImage || latestDraft.customImage || '',
              prompt: latestDraft.prompt || '',
              designId: latestDraft._id,
              design: latestDraft,
            }
            setCurrentDesign(syntheticResponse)
            setViewState('result')
            setIsSaved(false)
            startCooldown()
            showToast('Thiết kế đã được tạo!')
          } else {
            setGenerateError('Yêu cầu mất quá lâu. Ảnh có thể đã được tạo — hãy kiểm tra Thư viện.')
          }
        } catch {
          setGenerateError('Yêu cầu mất quá lâu. Hãy kiểm tra Thư viện để xem ảnh đã được tạo chưa.')
        }
      } else {
        setGenerateError('Đã có lỗi xảy ra, vui lòng thử lại.')
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleRefine = async (prompt: string) => {
    if (!currentDesign) return
    setRefining(true)
    try {
      const res = await DesignService.refineDesign(currentDesign.designId, prompt)
      setCurrentDesign(res.data.data)
      setIsSaved(false)
      showToast('Thiết kế đã được cập nhật!')
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Tinh chỉnh thất bại', 'error')
    } finally {
      setRefining(false)
    }
  }

  const handleSave = async () => {
    if (!currentDesign) return
    setSaving(true)
    try {
      await DesignService.saveDesign(currentDesign.designId)
      setIsSaved(true)
      setCurrentDesign((prev) =>
        prev ? { ...prev, design: { ...prev.design, status: 'SAVED' } } : prev
      )
      showToast('Đã lưu vào thư viện thiết kế!')
      // Refresh library in background so it's up-to-date when user switches tab
      fetchLibrary()
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Lưu thất bại', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveCurrentToLibrary = async (): Promise<UploadedCustomImage | null> => {
    if (!currentDesign) return null
    const cached = libraryAssetByDesign[currentDesign.designId]
    // A refine keeps the same designId but changes the image, so only reuse a matching URL.
    const currentUrl = currentDesign.imageUrl || currentDesign.preview
    if (cached && (!currentUrl || cached.url === currentUrl)) return cached
    setSavingToLibrary(true)
    try {
      const res = await DesignService.saveGeneratedToLibrary(currentDesign.designId)
      const image = res.data.data.image
      setLibraryAssetByDesign((prev) => ({ ...prev, [currentDesign.designId]: image }))
      return image
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast(message || 'Không thể lưu vào thư viện ảnh', 'error')
      return null
    } finally {
      setSavingToLibrary(false)
    }
  }

  const handleSaveToLibrary = async () => {
    const image = await saveCurrentToLibrary()
    if (image) showToast('Đã lưu vào thư viện ảnh — dùng ngay trong Custom Design!')
  }

  const handleDesignShirt = async () => {
    const image = await saveCurrentToLibrary()
    if (!image) return
    setPendingAsset(image)
    setActiveTab('custom')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openOrderModal = (designId: string, thumbnail?: string) => {
    setOrderDesignId(designId)
    setOrderThumbnail(thumbnail)
    setShowOrderModal(true)
  }

  const handleOrderSubmit = async (form: OrderForm) => {
    if (!orderDesignId) return
    setOrderSubmitting(true)
    try {
      const res = await DesignService.orderDesign(orderDesignId, {
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          city: form.city,
        },
        price: Number(form.price),
        ...(form.note && { note: form.note }),
      })
      setShowOrderModal(false)
      const orderId = res.data.data?.order?._id
      navigate(orderId ? `/orders/success/${orderId}` : '/orders')
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Đặt hàng thất bại', 'error')
    } finally {
      setOrderSubmitting(false)
    }
  }

  const handleReuseFromLibrary = (design: Design) => {
    setReuseInitial({
      prompt: design.prompt,
      style: design.style,
      shirtColor: design.shirtColor,
    })
    setViewState('form')
    setCurrentDesign(null)
    setGenerateError(null)
    setActiveTab('create')
  }

  const handleOrderFromLibrary = (design: Design) => {
    const thumb = design.previewImage || design.customImage
    openOrderModal(design._id, thumb)
  }

  const handleDeleteDesign = async (id: string) => {
    try {
      await DesignService.deleteDesign(id)
      setMyDesigns((prev) => prev.filter((d) => d._id !== id))
      showToast('Đã xóa thiết kế')
    } catch {
      showToast('Xóa thất bại', 'error')
    }
  }

  const fetchLibrary = async () => {
    setLoadingLibrary(true)
    setLibraryError(null)
    try {
      const res = await DesignService.getMyDesigns()
      setMyDesigns(res.data.data.designs)
    } catch (err: any) {
      console.error('fetchLibrary error:', err);
      const serverMsg = err?.response?.data?.message;
      const sysMsg = err?.message || String(err);
      setLibraryError(serverMsg || `Không thể tải thư viện: ${sysMsg}`)
    } finally {
      setLoadingLibrary(false)
    }
  }

  // Fetch library every time user switches to library tab (no caching flag)
  useEffect(() => {
    if (activeTab === 'library') {
      fetchLibrary()
    }
  }, [activeTab])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
      {/* ── Header ── */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
          ALTERA — Design Studio
        </p>
        <h1 className="heading-brand text-4xl md:text-5xl">
          Phòng Thiết Kế
        </h1>
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)] max-w-md">
          Phác thảo ý tưởng, để AI tạo nên một thiết kế thời trang độc đáo cho bạn.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="mb-6 flex gap-0 border-b border-[var(--color-border)]">
        {(['create', 'custom', 'library'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'relative px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 inline-flex items-center gap-2',
              'after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:transition-transform after:duration-200',
              activeTab === tab
                ? 'text-[var(--color-foreground)] after:bg-white after:scale-x-100'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] after:bg-white after:scale-x-0 hover:after:scale-x-100',
            )}
          >
            {tab === 'create' ? (
              <><Wand2 className="h-3.5 w-3.5" /> Phác thảo mới</>
            ) : tab === 'custom' ? (
              <>Custom Design</>
            ) : (
              <><BookOpen className="h-3.5 w-3.5" /> Thư viện</>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'create' && (
        <CreateTab
          viewState={viewState}
          generating={generating}
          refining={refining}
          saving={saving}
          isSaved={isSaved}
          currentDesign={currentDesign}
          generateError={generateError}
          onGenerate={handleGenerate}
          onRefine={handleRefine}
          onSave={handleSave}
          onOrder={() => {
            if (currentDesign) {
              const thumb = currentDesign.preview
                || currentDesign.imageUrl
                || currentDesign.design?.previewImage
                || currentDesign.design?.customImage
              openOrderModal(currentDesign.designId, thumb)
            }
          }}
          onReset={() => {
            setViewState('form')
            setCurrentDesign(null)
            setGenerateError(null)
            setIsSaved(false)
            setReuseInitial(undefined)
          }}
          initialValues={reuseInitial}
          cooldown={cooldown}
          savedToLibrary={Boolean(
            currentDesign
            && libraryAssetByDesign[currentDesign.designId]
            && libraryAssetByDesign[currentDesign.designId].url === (currentDesign.imageUrl || currentDesign.preview || libraryAssetByDesign[currentDesign.designId].url),
          )}
          savingToLibrary={savingToLibrary}
          onSaveToLibrary={handleSaveToLibrary}
          onDesignShirt={handleDesignShirt}
        />
      )}

      {activeTab === 'custom' && (
        <CustomDesignTab pendingAsset={pendingAsset} onPendingAssetConsumed={() => setPendingAsset(null)} />
      )}

      {activeTab === 'library' && (
        <LibraryTab
          designs={myDesigns}
          loading={loadingLibrary}
          error={libraryError}
          onReuse={handleReuseFromLibrary}
          onOrder={handleOrderFromLibrary}
          onDelete={handleDeleteDesign}
          onRefetch={fetchLibrary}
          onCreateNew={() => setActiveTab('create')}
        />
      )}

      {/* Order Modal */}
      <OrderModal
        open={showOrderModal}
        onOpenChange={setShowOrderModal}
        thumbnailUrl={orderThumbnail}
        onSubmit={handleOrderSubmit}
        submitting={orderSubmitting}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </div>
  )
}
