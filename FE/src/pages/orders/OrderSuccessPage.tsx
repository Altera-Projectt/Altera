import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Package, MapPin, CreditCard, Truck, ArrowRight, Copy, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { OrderService, PaymentService } from '@/services/order.api'
import { formatVND } from '@/utils/format'
import type { Order } from '@/types/order.types'

// ── Helper to format payment method ───────────────────────────────────────

function formatPaymentMethod(method?: string) {
  if (method === 'COD') return 'Thanh toán khi nhận hàng (COD)'
  if (method === 'BANK_TRANSFER') return 'Chuyển khoản ngân hàng'
  if (method === 'MOMO') return 'Thanh toán MoMo'
  return method || '—'
}

function getPaymentStatusBadge(status: string) {
  switch (status?.toUpperCase()) {
    case 'PAID':      return <Badge variant="success">Đã thanh toán</Badge>
    case 'PENDING':   return <Badge variant="warning">Chờ thanh toán</Badge>
    case 'FAILED':    return <Badge variant="danger">Thất bại</Badge>
    case 'CANCELLED': return <Badge variant="danger">Đã hủy</Badge>
    case 'EXPIRED':   return <Badge variant="muted">Hết hạn</Badge>
    default:          return <Badge variant="muted">{status || 'PENDING'}</Badge>
  }
}

// ── Stagger animation variants ─────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as any } },
}

// ── Component ──────────────────────────────────────────────────────────────

export function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<any>(null)
  const [retrying, setRetrying] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pollingDone, setPollingDone] = useState(false)
  const momoResultCode = searchParams.get('resultCode')
  const paymentError = searchParams.get('paymentError')

  useEffect(() => {
    if (!id) return
    const fetchOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await OrderService.getOrder(id)
        const data = response.data.data
        // Handle both { order: Order } and Order directly
        const orderData = (data as any)?.order ?? data
        setOrder(orderData)
        const paymentResponse = await PaymentService.status(id)
        setPayment(paymentResponse.data.data)
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Không tìm thấy đơn hàng')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  useEffect(() => {
    if (!id || !order || order.paymentMethod === 'COD' || payment?.paymentStatus !== 'PENDING') return
    let attempts = 0
    const timer = window.setInterval(async () => {
      attempts += 1
      try {
        const response = await PaymentService.status(id)
        setPayment(response.data.data)
        if (response.data.data.paymentStatus !== 'PENDING' || attempts >= 360) { window.clearInterval(timer); setPollingDone(attempts >= 360) }
      } catch { if (attempts >= 360) { window.clearInterval(timer); setPollingDone(true) } }
    }, 5000)
    return () => window.clearInterval(timer)
  }, [id, order, payment?.paymentStatus])

  const refreshPayment = async () => {
    if (!id) return
    try { const response = await PaymentService.status(id); setPayment(response.data.data); setPollingDone(response.data.data.paymentStatus === 'PENDING') }
    catch (err: any) { setActionError(err?.response?.data?.message || 'Không thể kiểm tra trạng thái thanh toán.') }
  }

  const retryPayment = async () => {
    if (!id) return
    setRetrying(true)
    setPollingDone(false)
    try {
      if (order?.paymentMethod === 'MOMO') {
        const response = await PaymentService.createMomo(id)
        window.location.assign(response.data.data.paymentUrl)
      } else {
        const response = await PaymentService.retryBank(id)
        setPayment({ ...payment, ...response.data.data, paymentStatus: 'PENDING' })
      }
    } catch (err: any) { setActionError(err?.response?.data?.message || 'Không thể thử lại thanh toán.') }
    finally { setRetrying(false) }
  }

  // ── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Circular shimmer */}
          <div className="h-20 w-20 rounded-full bg-[var(--color-muted)] relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.06) 50%, transparent 80%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.8s ease-in-out infinite',
              }}
            />
          </div>
          <div className="space-y-3 w-full max-w-xs">
            <div className="h-4 w-48 mx-auto bg-[var(--color-muted)] rounded-sm" />
            <div className="h-3 w-32 mx-auto bg-[var(--color-muted)] rounded-sm" />
          </div>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center">
        <div className="h-20 w-20 rounded-full border border-[var(--color-error)]/30 flex items-center justify-center">
          <Package className="h-9 w-9 text-[var(--color-error)]/50" strokeWidth={1} />
        </div>
        <div>
          <h1 className="heading-brand text-3xl mb-2">Không tìm thấy đơn hàng</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">{error}</p>
        </div>
        <Button onClick={() => navigate('/orders')} variant="outline">
          Xem tất cả đơn hàng
        </Button>
      </div>
    )
  }

  // ── Derive data ────────────────────────────────────────────────────────

  const shipping = order.shippingAddress || {}
  const items: any[] = order.items || (order as any).orderItems || []
  const totalPrice = order.totalPrice ?? (order as any).totalAmount ?? 0
  const paymentStatus = payment?.paymentStatus || (order as any).paymentStatus || 'PENDING'

  const headlineText =
    order.paymentMethod === 'COD'
      ? 'Đặt hàng thành công!'
      : paymentStatus === 'PAID'
      ? 'Thanh toán thành công!'
      : paymentStatus === 'FAILED'
      ? 'Thanh toán không thành công'
      : paymentStatus === 'CANCELLED' || paymentStatus === 'EXPIRED'
      ? 'Thanh toán chưa hoàn tất'
      : momoResultCode && momoResultCode !== '0'
      ? 'MoMo chưa xác nhận thanh toán'
      : 'Đang chờ thanh toán'

  const isSuccess = order.paymentMethod === 'COD' || paymentStatus === 'PAID'

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 min-h-[70vh]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >

        {/* ── Receipt header ── */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          {/* Success icon */}
          <div className="relative inline-flex mx-auto">
            <div className={[
              'h-20 w-20 rounded-full flex items-center justify-center',
              isSuccess ? 'bg-[var(--color-success)]/10 border border-[var(--color-success)]/30' : 'bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30',
            ].join(' ')}>
              {isSuccess ? (
                <CheckCircle className="h-9 w-9 text-[var(--color-success)]" strokeWidth={1.5} />
              ) : (
                <Clock className="h-9 w-9 text-[var(--color-warning)]" strokeWidth={1.5} />
              )}
            </div>
            {/* Ping dot */}
            {isSuccess && (
              <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-60" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[var(--color-success)]" />
              </span>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
              ALTERA — Order Confirmation
            </p>
            <h1 className="heading-brand text-4xl mb-2">{headlineText}</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Cảm ơn bạn đã tin tưởng ALTERA. Đơn hàng của bạn đang được xử lý.
            </p>
          </div>

          {/* MoMo / payment error notice */}
          {paymentStatus !== 'PAID' && (paymentError || (momoResultCode && momoResultCode !== '0')) && (
            <p role="alert" className="text-xs text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-[var(--radius-md)] px-4 py-2.5">
              {paymentError || `MoMo trả về mã kết quả ${momoResultCode}. Trạng thái cuối cùng sẽ được xác nhận từ máy chủ.`}
            </p>
          )}

          {/* Order ID chip */}
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--color-border)] bg-[var(--color-card)] rounded-full text-xs font-bold uppercase tracking-widest">
            <Package className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
            #{order._id?.slice(-8).toUpperCase()}
          </div>
        </motion.div>

        {/* ── Receipt card ── */}
        <motion.div
          variants={itemVariants}
          className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden"
        >

          {/* Items */}
          {items.length > 0 && (
            <div className="p-6 border-b border-[var(--color-border)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4 flex items-center gap-2">
                <Package className="h-3.5 w-3.5" /> Sản phẩm đặt mua
              </p>
              <div className="space-y-4">
                {items.map((item: any, idx: number) => {
                  const product = item.product ?? item.productId ?? {}
                  const name = product.name ?? item.name ?? `Sản phẩm ${idx + 1}`
                  const qty = item.quantity ?? 1
                  const price = item.price ?? product.price ?? 0
                  const img = product.imageUrl

                  return (
                    <div key={idx} className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="h-14 w-14 shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-muted)] overflow-hidden border border-[var(--color-border)]">
                        {img ? (
                          <img src={img} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-[var(--color-border)]" strokeWidth={1} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{name}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">Qty: {qty}</p>
                      </div>
                      <span className="text-sm font-bold whitespace-nowrap">{formatVND(price * qty)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="px-6 py-5 border-b border-[var(--color-border)]">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                Tổng cộng
              </span>
              <span className="text-xl font-black text-[var(--color-foreground)]">{formatVND(totalPrice)}</span>
            </div>
          </div>

          {/* Shipping address */}
          <div className="p-6 border-b border-[var(--color-border)]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> Địa chỉ giao hàng
            </p>
            <div className="text-sm space-y-1">
              {(shipping as any).fullName && (
                <p className="font-bold text-[var(--color-foreground)]">{(shipping as any).fullName}</p>
              )}
              {(shipping as any).phone && (
                <p className="text-[var(--color-muted-foreground)]">{(shipping as any).phone}</p>
              )}
              {((shipping as any).address || (shipping as any).street) && (
                <p className="text-[var(--color-muted-foreground)]">
                  {(shipping as any).address ?? (shipping as any).street}
                </p>
              )}
              {(shipping as any).province && (
                <p className="text-[var(--color-muted-foreground)]">{(shipping as any).province}</p>
              )}
              {(shipping as any).city && (
                <p className="text-[var(--color-muted-foreground)]">{(shipping as any).city}</p>
              )}
            </div>
          </div>

          {/* Payment method */}
          <div className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4 flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5" /> Phương thức thanh toán
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {order.paymentMethod === 'COD' ? (
                  <Truck className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                ) : (
                  <CreditCard className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                )}
                <span className="text-[var(--color-muted-foreground)]">
                  {formatPaymentMethod(order.paymentMethod)}
                </span>
              </div>
              {getPaymentStatusBadge(paymentStatus)}
            </div>

            {payment?.transactionId && (
              <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
                Mã giao dịch: <span className="text-[var(--color-foreground)] font-mono">{payment.transactionId}</span>
              </p>
            )}
            {payment?.failureReason && (
              <p className="mt-2 text-xs text-[var(--color-error)]">{payment.failureReason}</p>
            )}
            {pollingDone && paymentStatus === 'PENDING' && (
              <div className="mt-4 flex items-center gap-3">
                <p className="text-xs text-[var(--color-muted-foreground)]">Chưa nhận được kết quả thanh toán.</p>
                <Button variant="outline" size="sm" onClick={refreshPayment}>
                  Kiểm tra lại
                </Button>
              </div>
            )}
          </div>

          {/* ── Bank transfer QR block ── */}
          {payment?.transfer && paymentStatus !== 'PAID' && (
            <div className="border-t border-[var(--color-border)] p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-5">
                Thanh toán chuyển khoản
              </p>
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                {/* QR Code with premium glow border */}
                <div className="shrink-0">
                  <div className="p-1 rounded-[var(--radius-lg)] bg-white shadow-[0_0_30px_rgba(255,255,255,0.08)] border border-white/10">
                    <img
                      src={payment.transfer.qrCodeUrl}
                      alt="VietQR payment code"
                      className="h-48 w-48 rounded-[var(--radius-md)] object-contain"
                    />
                  </div>
                  <p className="text-center text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mt-2">
                    Scan to Pay
                  </p>
                </div>

                {/* Transfer details */}
                <div className="space-y-3 text-sm flex-1">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-0.5">
                      Ngân hàng
                    </p>
                    <p className="font-bold text-[var(--color-foreground)]">{payment.transfer.bankName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-0.5">
                      Số tài khoản
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[var(--color-foreground)] font-mono">{payment.transfer.accountNumber}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(payment.transfer.accountNumber)}
                        className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-0.5">
                      Tên tài khoản
                    </p>
                    <p className="font-bold text-[var(--color-foreground)]">{payment.transfer.accountName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-0.5">
                      Số tiền
                    </p>
                    <p className="font-bold text-[var(--color-foreground)]">{formatVND(payment.transfer.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-0.5">
                      Nội dung chuyển khoản
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[var(--color-foreground)] font-mono text-xs">{payment.transfer.paymentContent}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(payment.transfer.paymentContent)}
                        className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-warning)] pt-1 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Đang chờ ngân hàng xác nhận…
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Action buttons ── */}
        <motion.div variants={itemVariants} className="space-y-3">
          {actionError && (
            <p role="alert" className="text-xs text-center text-[var(--color-error)]">{actionError}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Retry payment button */}
            {payment && (
              ['FAILED', 'EXPIRED', 'CANCELLED'].includes(paymentStatus) ||
              (order.paymentMethod === 'MOMO' && paymentStatus === 'PENDING')
            ) && (
              <Button
                variant="outline"
                size="lg"
                className="flex-1 uppercase font-bold tracking-widest"
                loading={retrying}
                onClick={retryPayment}
              >
                {order.paymentMethod === 'MOMO' && paymentStatus === 'PENDING'
                  ? 'Tiếp tục thanh toán MoMo'
                  : 'Thử lại thanh toán'}
              </Button>
            )}

            <Button
              variant="secondary"
              size="lg"
              className="flex-1 uppercase font-bold tracking-widest"
              onClick={() => navigate('/orders')}
            >
              Xem đơn hàng
            </Button>

            <Button
              variant="primary"
              size="lg"
              className="flex-1 gap-2 uppercase font-bold tracking-widest"
              onClick={() => navigate('/products')}
            >
              Tiếp tục mua sắm
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

      </motion.div>
    </div>
  )
}
