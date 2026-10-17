import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, ChevronRight, ArrowRight, ShoppingBag } from 'lucide-react'
import { OrderService } from '@/services/order.api'
import type { Order } from '@/types/order.types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatVND, optimizeCloudinaryUrl } from '@/utils/format'

// ── Helpers ────────────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return <Badge variant="warning">Chờ xử lý</Badge>
    case 'CONFIRMED':
      return <Badge variant="secondary">Đã xác nhận</Badge>
    case 'PROCESSING':
      return <Badge variant="secondary">Đang chuẩn bị</Badge>
    case 'SHIPPED':
      return <Badge variant="outline">Đang vận chuyển</Badge>
    case 'DELIVERED':
      return <Badge variant="success">Đã giao hàng</Badge>
    case 'CANCELLED':
      return <Badge variant="danger">Đã hủy</Badge>
    case 'PAID':
      return <Badge variant="success">Đã thanh toán</Badge>
    case 'FAILED':
      return <Badge variant="danger">Thất bại</Badge>
    default:
      return <Badge variant="muted">{status || '—'}</Badge>
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ── Component ──────────────────────────────────────────────────────────────

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await OrderService.getMyOrders(page)
      const data = response.data.data
      setOrders(data.orders)
      setTotalPages(data.pagination.totalPages || 1)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page])

  // ── Loading skeleton ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
        <div className="mb-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
            ALTERA
          </p>
          <h1 className="heading-brand text-4xl md:text-5xl">Đơn hàng của tôi</h1>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] w-full rounded-[var(--radius-xl)] bg-[var(--color-muted)] relative overflow-hidden"
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.04) 50%, transparent 80%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.8s ease-in-out infinite',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center gap-5 text-center">
        <div className="h-16 w-16 rounded-full border border-[var(--color-error)]/30 flex items-center justify-center">
          <Package className="h-7 w-7 text-[var(--color-error)]/60" strokeWidth={1} />
        </div>
        <p className="text-sm text-[var(--color-error)]">{error}</p>
        <Button onClick={() => fetchOrders()} variant="outline" size="sm">
          Thử lại
        </Button>
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="h-24 w-24 rounded-full border border-[var(--color-border)] flex items-center justify-center">
            <Package className="h-10 w-10 text-[var(--color-border)]" strokeWidth={1} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-3">
              ALTERA — Đơn hàng
            </p>
            <h1 className="heading-brand text-4xl mb-3">Chưa có đơn hàng nào</h1>
            <p className="text-sm text-[var(--color-muted-foreground)] max-w-xs">
              Bắt đầu hành trình phong cách của bạn cùng ALTERA ngay hôm nay.
            </p>
          </div>
          <Button asChild variant="primary" size="lg" className="gap-2 uppercase font-bold tracking-widest">
            <Link to="/products" className="flex items-center gap-2">
              Khám phá mua sắm
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  // ── Orders list ────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mb-10"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
          ALTERA
        </p>
        <h1 className="heading-brand text-4xl md:text-5xl">Đơn hàng của tôi</h1>
      </motion.div>

      {/* Column labels */}
      <div className="hidden md:grid md:grid-cols-[1fr_120px_120px_120px_48px] gap-4 pb-4 border-b border-[var(--color-border)] mb-2">
        {['Mã đơn', 'Ngày đặt', 'Trạng thái', 'Tổng tiền', ''].map((label) => (
          <span key={label} className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            {label}
          </span>
        ))}
      </div>

      {/* Order rows */}
      <motion.div
        className="space-y-0"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {orders.map((order) => {
          const isExpanded = expandedId === order._id
          const items: any[] = order.items || (order as any).orderItems || []
          const totalPrice = order.totalPrice ?? (order as any).totalAmount ?? 0
          const status = (order as any).status || (order as any).orderStatus || 'PENDING'
          const createdAt = (order as any).createdAt

          return (
            <motion.div
              key={order._id}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
              className="border-b border-[var(--color-border)] last:border-0"
            >
              {/* Row — clickable */}
              <button
                type="button"
                className="w-full grid grid-cols-1 md:grid-cols-[1fr_120px_120px_120px_48px] gap-4 items-center py-5 text-left hover:bg-white/[0.02] transition-colors group"
                onClick={() => setExpandedId(isExpanded ? null : order._id)}
                aria-expanded={isExpanded}
              >
                {/* Order ID + item count */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-[var(--radius-md)] bg-[var(--color-muted)] flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-[var(--color-muted-foreground)]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-foreground)]">
                      #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
                      {items.length} sản phẩm
                    </p>
                  </div>
                </div>

                {/* Date */}
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {createdAt ? formatDate(createdAt) : '—'}
                </span>

                {/* Status */}
                <div>{getStatusBadge(status)}</div>

                {/* Total */}
                <span className="text-sm font-bold text-[var(--color-foreground)]">
                  {formatVND(totalPrice)}
                </span>

                {/* Chevron */}
                <div className="flex justify-end">
                  <ChevronRight
                    className={[
                      'h-4 w-4 text-[var(--color-muted-foreground)] transition-transform duration-300',
                      isExpanded ? 'rotate-90' : 'group-hover:translate-x-0.5',
                    ].join(' ')}
                  />
                </div>
              </button>

              {/* Expanded items */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="items"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pb-5 pl-[52px] pr-2 space-y-0">
                      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
                        {items.length > 0 ? (
                          <>
                            {items.map((item: any, idx: number) => {
                              const product = item.product ?? item.productId ?? {}
                              const name = product.name ?? item.name ?? `Sản phẩm ${idx + 1}`
                              const qty = item.quantity ?? 1
                              const price = item.price ?? product.price ?? 0
                              const img = product.imageUrl

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-4 px-5 py-4 border-b border-[var(--color-border)] last:border-0"
                                >
                                  {/* Thumbnail */}
                                  <div className="h-12 w-12 shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-muted)] overflow-hidden border border-[var(--color-border)]">
                                    {img ? (
                                      <img src={optimizeCloudinaryUrl(img, 200)} alt={name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center">
                                        <Package className="h-4 w-4 text-[var(--color-border)]" strokeWidth={1} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium line-clamp-1">{name}</p>
                                    <p className="text-xs text-[var(--color-muted-foreground)]">
                                      SL: {qty}
                                    </p>
                                  </div>
                                  <span className="text-sm font-bold whitespace-nowrap">
                                    {formatVND(price * qty)}
                                  </span>
                                </div>
                              )
                            })}
                            {/* Row total */}
                            <div className="flex justify-between items-center px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-muted)]/30">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                                Tổng giá trị đơn
                              </span>
                              <span className="text-base font-black text-[var(--color-foreground)]">
                                {formatVND(totalPrice)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <p className="px-5 py-4 text-xs text-[var(--color-muted-foreground)]">
                            Chưa có thông tin chi tiết.
                          </p>
                        )}
                      </div>
                      {/* View full order link */}
                      <div className="flex justify-end pt-3">
                        <Link
                          to={`/orders/success/${order._id}`}
                          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                        >
                          Xem chi tiết
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12 pt-8 border-t border-[var(--color-border)]">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </Button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  )
}
