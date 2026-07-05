import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Palette,
  Trash2,
  ShoppingBag,
  RotateCcw,
  Wand2,
  RefreshCw,
  BookOpen,
  Plus,
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
} from '@/services/design.api'
import { cn } from '@/utils/cn'

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
              : 'bg-[var(--color-error)] text-white',
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
      <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
        {label}
      </label>
      <select
        className={cn(
          'w-full h-10 px-3 text-sm',
          'bg-[var(--color-background)] text-[var(--color-foreground)]',
          'border border-[var(--color-border)] rounded-[var(--radius-md)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
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
  colorPalette: string
  shirtColor: string
}

function GenerateForm({
  onGenerate,
  generating,
  initialValues,
  error,
}: {
  onGenerate: (vals: FormValues) => Promise<void>
  generating: boolean
  initialValues?: Partial<FormValues>
  error: string | null
}) {
  const [form, setForm] = useState<FormValues>({
    prompt: initialValues?.prompt ?? '',
    style: initialValues?.style ?? 'Graphic Art',       // default — phù hợp nhất cho print design
    colorPalette: initialValues?.colorPalette ?? 'Black and white, high contrast', // default — luôn ra đẹp
    shirtColor: initialValues?.shirtColor ?? 'white',
  })
  const [promptError, setPromptError] = useState('')
  const [countdown, setCountdown] = useState(15)

  // Countdown effect while generating
  useEffect(() => {
    if (!generating) { setCountdown(15); return }
    setCountdown(15)
    const interval = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(interval)
  }, [generating])

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="border border-[var(--color-error)] bg-red-50 text-[var(--color-error)] rounded-[var(--radius-md)] p-3 text-sm">
          {error}
        </div>
      )}

      {/* Prompt Examples */}
      <div className="rounded-[var(--radius-md)] bg-[var(--color-muted)] p-3">
        <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2">
          Ví dụ prompt tốt:
        </p>
        <div className="flex flex-wrap gap-2">
          {PROMPT_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, prompt: example }))}
              className={cn(
                'text-xs px-2 py-1 rounded-[var(--radius-sm)]',
                'border border-[var(--color-border)] bg-[var(--color-background)]',
                'hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)] hover:border-[var(--color-primary)]',
                'transition-all duration-200 cursor-pointer',
              )}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt — full width */}
      <div className="w-full">
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
          Mô tả hình muốn in lên áo <span className="text-[var(--color-accent)]">*</span>
        </label>
        <textarea
          className={cn(
            'w-full min-h-[100px] px-3 py-2 text-sm',
            'bg-[var(--color-background)] text-[var(--color-foreground)]',
            'border rounded-[var(--radius-md)]',
            'placeholder:text-[var(--color-muted-foreground)]',
            'transition-colors duration-150 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-transparent',
            promptError
              ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
              : 'border-[var(--color-border)]',
          )}
          placeholder="VD: Con đại bàng dang cánh, phong cách cổ điển..."
          value={form.prompt}
          onChange={setField('prompt')}
          disabled={generating}
        />
        {promptError ? (
          <p className="mt-1.5 text-xs text-[var(--color-error)]">{promptError}</p>
        ) : (
          <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">
            Mô tả càng chi tiết càng tốt: con vật/vật thể, phong cách, màu sắc mong muốn
          </p>
        )}
      </div>

      {/* Phong cách nghệ thuật */}
      <SelectField
        label="Phong cách nghệ thuật"
        value={form.style}
        onChange={setField('style')}
        disabled={generating}
      >
        {STYLE_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </SelectField>
      {currentStyleHint && (
        <p className="-mt-4 text-xs text-[var(--color-muted-foreground)] pl-0.5">{currentStyleHint}</p>
      )}

      {/* Màu sắc */}
      <Input
        label="Màu sắc"
        placeholder="VD: Đỏ, vàng, đen — hoặc mô tả tông màu"
        value={form.colorPalette}
        onChange={setField('colorPalette')}
        disabled={generating}
        hint="Màu đen trắng luôn cho kết quả in đẹp nhất"
      />

      {/* Màu áo */}
      <SelectField
        label="Màu áo"
        value={form.shirtColor}
        onChange={setField('shirtColor')}
        disabled={generating}
      >
        {SHIRT_COLOR_OPTIONS.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </SelectField>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={generating}
        className="w-full uppercase font-semibold tracking-widest h-14 mt-2"
      >
        {!generating && <Wand2 className="h-5 w-5 mr-2" />}
        {generating ? `Đang phác thảo... ${countdown}s` : 'Phác thảo ý tưởng'}
      </Button>
    </form>
  )
}

function ResultControls({
  result,
  isSaved,
  saving,
  refining,
  onSave,
  onOrder,
  onRefine,
  onReset,
}: {
  result: GenerateDesignResponse
  isSaved: boolean
  saving: boolean
  refining: boolean
  onSave: () => Promise<void>
  onOrder: () => void
  onRefine: (prompt: string) => Promise<void>
  onReset: () => void
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
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wider mb-3">
          Thiết kế đã tạo
        </h3>
        
        {/* Style + ShirtType badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {design.style && <Badge variant="secondary">{design.style}</Badge>}
          {design.shirtType && <Badge variant="secondary">{design.shirtType}</Badge>}
          {design.shirtColor && <Badge variant="secondary" className="capitalize">{design.shirtColor}</Badge>}
        </div>

        {/* Refine */}
        <form onSubmit={handleRefineSubmit} className="flex gap-2">
          <input
            className={cn(
              'flex-1 h-10 px-3 text-sm',
              'bg-[var(--color-background)] text-[var(--color-foreground)]',
              'border border-[var(--color-border)] rounded-[var(--radius-md)]',
              'placeholder:text-[var(--color-muted-foreground)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed transition-all'
            )}
            placeholder="VD: Thêm chi tiết, đổi màu..."
            value={refinePrompt}
            onChange={(e) => setRefinePrompt(e.target.value)}
            disabled={refining}
          />
          <Button type="submit" variant="outline" loading={refining} disabled={refining || !refinePrompt.trim()}>
            <RefreshCw className={cn('h-4 w-4', refining && 'animate-spin')} />
            Tinh chỉnh
          </Button>
        </form>
      </div>

      <div className="mt-auto pt-6 flex flex-col gap-3">
        {/* Save */}
        <Button
          variant="outline"
          size="md"
          className="w-full gap-2 transition-all hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)]"
          onClick={onSave}
          disabled={isSaved || saving}
          loading={saving}
        >
          {isSaved ? 'Đã lưu vào bộ sưu tập' : 'Lưu bản thảo'}
        </Button>

        {/* Order */}
        <Button
          variant="primary"
          size="lg"
          className="w-full gap-2 uppercase font-semibold tracking-widest h-14 transition-transform active:scale-95"
          onClick={onOrder}
        >
          <ShoppingBag className="h-5 w-5" />
          Đặt hàng ngay
        </Button>
        
        {/* Reset */}
        <Button
          variant="ghost"
          size="md"
          className="w-full mt-2 text-[var(--color-muted-foreground)]"
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
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
        className="w-full bg-[var(--color-muted)] overflow-hidden"
        style={{ height: 200, borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}
      >
        {img ? (
          <img
            src={img}
            alt={design.prompt ?? 'Design'}
            className="w-full h-full object-cover"
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
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[650px]">
      {/* ── Left Sidebar (Controls) ── */}
      <aside className="w-full lg:w-[420px] flex flex-col shrink-0">
        <Card className="flex flex-col h-full p-6 border-[var(--color-border)] shadow-sm bg-[var(--color-background)] group hover:border-[var(--color-foreground)] transition-colors duration-500">
          <div className="mb-6 border-b border-[var(--color-border)] pb-4">
             <h2 className="font-heading text-lg uppercase tracking-widest font-semibold flex items-center gap-2">
                <Wand2 className="w-5 h-5" /> Creator Tools
             </h2>
          </div>
          
          <div className={cn("transition-opacity duration-300", (viewState === 'result' && currentDesign) ? "hidden" : "block")}>
            <GenerateForm
              onGenerate={onGenerate}
              generating={generating}
              initialValues={initialValues}
              error={generateError}
            />
          </div>

          {viewState === 'result' && currentDesign && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500 flex-1">
              <ResultControls 
                result={currentDesign}
                isSaved={isSaved}
                saving={saving}
                refining={refining}
                onSave={onSave}
                onOrder={onOrder}
                onRefine={onRefine}
                onReset={onReset}
              />
            </div>
          )}
        </Card>
      </aside>

      {/* ── Central Canvas ── */}
      <div className="flex-1 relative bg-[var(--color-neutral)] rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden flex items-center justify-center p-8 min-h-[500px] shadow-inner">
         {generating ? (
            <div className="absolute inset-0 bg-[var(--color-background)]/60 backdrop-blur-md flex flex-col items-center justify-center z-10 animate-in fade-in duration-300">
               <div className="h-16 w-16 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-foreground)] mb-6 shadow-lg" />
               <p className="font-heading uppercase tracking-widest text-[var(--color-foreground)] font-semibold animate-pulse">AI đang tạo thiết kế của bạn...</p>
            </div>
         ) : viewState === 'result' && currentDesign ? (
            <div className="animate-in zoom-in-95 fade-in duration-700 w-full h-full flex items-center justify-center">
              <div
                className="relative w-full max-w-[400px] mx-auto rounded-[var(--radius-xl)] shadow-2xl overflow-hidden transition-transform hover:scale-[1.02] duration-500"
                style={{ aspectRatio: '3/4', backgroundColor: getShirtHex(currentDesign.design.shirtColor ?? 'white') }}
              >
                {/* Collar */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-12 rounded-b-[3rem] border-b-2 border-x-2 border-black/5" />
                
                {/* Image */}
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
            </div>
         ) : (
            <div className="opacity-50 hover:opacity-80 transition-opacity duration-300">
              <EmptyState
                icon={Palette}
                title="Canvas trống"
                description="Mô tả ý tưởng trong phần bên trái và để AI phác thảo cho bạn."
              />
            </div>
         )}
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
  const [activeTab, setActiveTab] = useState<'create' | 'library'>('create')
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

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGenerate = async (vals: FormValues) => {
    try {
      setGenerating(true)
      setGenerateError(null)
      // Always send with fallbacks so BE has full context
      const payload = {
        prompt: vals.prompt.trim(),
        style: vals.style || 'Graphic Art',
        colorPalette: vals.colorPalette || 'Black and white, high contrast',
        shirtColor: vals.shirtColor || 'white',
      }
      const res = await DesignService.generateDesign(payload)
      setCurrentDesign(res.data.data)
      setViewState('result')
      setIsSaved(false)
    } catch (err: any) {
      const status = err.response?.status
      if (status === 429) {
        setGenerateError('Vui lòng chờ 15 giây trước khi tạo thiết kế mới.')
      } else if (status === 503) {
        setGenerateError('Dịch vụ đang bận, vui lòng thử lại sau ít phút.')
      } else if (status === 400) {
        setGenerateError('Vui lòng mô tả hình muốn in.')
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
      colorPalette: design.colorPalette,
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
      setLibraryError(err?.response?.data?.message || 'Không thể tải thư viện')
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
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl font-normal uppercase tracking-widest flex items-center gap-3">
            Phòng Thiết kế
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)] tracking-wide">
            Phác thảo ý tưởng, để AI tạo nên một thiết kế thời trang độc đáo cho bạn.
          </p>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="mb-8 flex gap-2 border-b border-[var(--color-border)] pb-0">
        {(['create', 'library'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 inline-flex items-center gap-1.5',
              activeTab === tab
                ? 'border-[var(--color-primary)] text-[var(--color-foreground)]'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            )}
          >
            {tab === 'create' ? (
              <><Wand2 className="h-4 w-4" /> Phác thảo mới</>
            ) : (
              <><BookOpen className="h-4 w-4" /> Thư viện của tôi</>
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
        />
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
