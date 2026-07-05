import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Palette, Trash2, ChevronLeft, ChevronRight, Calendar, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DesignService, type Design } from '@/services/design.api'
import { cn } from '@/utils/cn'
import { toast } from 'sonner'

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr))
}

// ── Component ──────────────────────────────────────────────────────────────

export function MyDesignsPage() {
  const navigate = useNavigate()
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchDesigns = async (currentPage = 1) => {
    try {
      setLoading(true)
      setError(null)
      const response = await DesignService.getMyDesigns(currentPage, 12)
      const data = response.data.data
      setDesigns(data.designs || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách thiết kế')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDesigns(page)
  }, [page])

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa thiết kế này?')) return
    try {
      setDeleting(id)
      await DesignService.deleteDesign(id)
      setDesigns((prev) => prev.filter((d) => d._id !== id))
      toast.success('Đã xóa thiết kế thành công')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xóa thất bại, vui lòng thử lại')
    } finally {
      setDeleting(null)
    }
  }

  // ── Loading State ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide mb-8">
          Thiết kế của tôi
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square w-full bg-zinc-300 dark:bg-zinc-800 rounded-[var(--radius-lg)] mb-3" />
              <div className="h-4 w-3/4 bg-zinc-300 dark:bg-zinc-800 rounded mb-2" />
              <div className="h-3 w-1/2 bg-zinc-300 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Error State ──────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center text-center">
        <Palette className="h-12 w-12 text-[var(--color-muted-foreground)] mb-4 opacity-40" />
        <p className="text-rose-500 font-medium mb-6">{error}</p>
        <Button onClick={() => fetchDesigns(page)} variant="outline">
          Thử lại
        </Button>
      </div>
    )
  }

  // ── Empty State ──────────────────────────────────────────────────────

  if (designs.length === 0) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide mb-8">
          Thiết kế của tôi
        </h1>
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-muted)]/30">
          <Palette className="h-16 w-16 text-[var(--color-muted-foreground)] mb-6 opacity-40" />
          <h2 className="text-2xl font-bold font-heading mb-2">Chưa có thiết kế nào</h2>
          <p className="text-[var(--color-muted-foreground)] mb-8 text-center max-w-xs">
            Bạn chưa tạo thiết kế nào. Hãy bắt đầu sáng tạo phong cách riêng của bạn!
          </p>
          <Button
            variant="primary"
            size="lg"
            className="uppercase font-semibold tracking-wider"
            onClick={() => navigate('/design')}
          >
            <Palette className="h-4 w-4" />
            Tạo thiết kế mới
          </Button>
        </div>
      </div>
    )
  }

  // ── Designs Grid ──────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wide">
            Thiết kế của tôi
          </h1>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
            {designs.length} thiết kế đã lưu
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/design')}
          className="uppercase font-semibold tracking-wider"
        >
          <Palette className="h-4 w-4" />
          Tạo thiết kế mới
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {designs.map((design) => {
          const isDeleting = deleting === design._id
          return (
            <div
              key={design._id}
              className="group relative flex flex-col bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Image / Placeholder */}
              <div className="relative aspect-square w-full bg-[var(--color-muted)] overflow-hidden">
                {(design.previewImage || design.customImage) ? (
                  <img
                    src={design.previewImage || design.customImage}
                    alt={design.prompt || 'Design'}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.onerror = null
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--color-muted-foreground)]">
                    <ImageOff className="h-10 w-10 opacity-40" />
                    {design.shirtColor && (
                      <div
                        className="h-8 w-8 rounded-full border-2 border-[var(--color-border)] shadow-inner"
                        style={{ backgroundColor: design.shirtColor }}
                        title={`Màu: ${design.shirtColor}`}
                      />
                    )}
                  </div>
                )}

                {/* Delete overlay button */}
                <div className="absolute top-2 right-2 translate-y-[-4px] opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleDelete(design._id)}
                    disabled={isDeleting}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-500 border border-rose-200 shadow-md hover:bg-rose-500 hover:text-white hover:border-transparent transition-colors disabled:opacity-50"
                    title="Xóa thiết kế"
                  >
                    {isDeleting ? (
                      <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Status badge */}
                {design.status && (
                  <div className="absolute bottom-2 left-2">
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      design.status === 'SAVED'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200',
                    )}>
                      {design.status === 'SAVED' ? 'Đã lưu' : 'Bản nháp'}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-medium text-sm line-clamp-1 mb-1">
                  {design.prompt
                    ? design.prompt.slice(0, 40) + (design.prompt.length > 40 ? '...' : '')
                    : 'Thiết kế ' + design._id.slice(-4)}
                </h3>

                {design.shirtType && (
                  <p className="text-xs text-[var(--color-muted-foreground)] mb-1">
                    Loại: {design.shirtType}
                  </p>
                )}

                {design.prompt && (
                  <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2 mb-2 italic">
                    "{design.prompt}"
                  </p>
                )}

                <div className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(design.createdAt)}</span>
                </div>
              </div>

              {/* Delete button always visible below */}
              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={() => handleDelete(design._id)}
                  disabled={isDeleting}
                  className="w-full text-xs text-[var(--color-muted-foreground)] hover:text-rose-500 transition-colors flex items-center justify-center gap-1 py-1.5 rounded border border-[var(--color-border)] hover:border-rose-200 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Xóa thiết kế
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          <span className="font-medium text-sm">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Tiếp
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
