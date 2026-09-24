import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Package, MapPin, CreditCard, Truck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="h-20 w-20 mx-auto rounded-full bg-[var(--color-muted)] animate-pulse" />
          <div className="space-y-3">
            <div className="h-6 w-48 mx-auto bg-[var(--color-muted)] animate-pulse rounded" />
            <div className="h-4 w-32 mx-auto bg-[var(--color-muted)] animate-pulse rounded" />
          </div>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────

  if (error || !order) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center text-center">
        <Package className="h-16 w-16 text-[var(--color-muted-foreground)] mb-6 opacity-40" />
        <h1 className="font-heading text-2xl font-bold mb-2">Không tìm thấy đơn hàng</h1>
        <p className="text-[var(--color-muted-foreground)] mb-8">{error}</p>
        <Button onClick={() => navigate('/orders')} variant="outline">
          Xem tất cả đơn hàng
        </Button>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────

  const shipping = order.shippingAddress || {}
  const items: any[] = order.items || order.orderItems || []
  const totalPrice = order.totalPrice ?? order.totalAmount ?? 0

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 min-h-[70vh]">

      {/* Success Icon & Title */}
      <div className="text-center mb-12">
        <div className="relative inline-flex">
          <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-md">
            <CheckCircle className="h-12 w-12 text-emerald-600" strokeWidth={1.5} />
          </div>
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
          </span>
        </div>
        <h1 className="font-heading text-4xl font-bold mb-3">{order.paymentMethod === 'COD' ? 'Đặt hàng thành công!' : payment?.paymentStatus === 'PAID' ? 'Thanh toán thành công!' : payment?.paymentStatus === 'FAILED' ? 'Thanh toán không thành công' : payment?.paymentStatus === 'CANCELLED' || payment?.paymentStatus === 'EXPIRED' ? 'Thanh toán chưa hoàn tất' : momoResultCode && momoResultCode !== '0' ? 'MoMo chưa xác nhận thanh toán thành công' : 'Đang chờ thanh toán'}</h1>
        <p className="text-[var(--color-muted-foreground)] text-lg">
          Cảm ơn bạn đã tin tưởng ALTERA. Đơn hàng của bạn đang được xử lý.
        </p>
        {payment?.paymentStatus !== 'PAID' && (paymentError || (momoResultCode && momoResultCode !== '0')) && <p role="alert" className="mt-3 text-red-700">{paymentError || `MoMo trả về mã kết quả ${momoResultCode}. Trạng thái cuối cùng sẽ được xác nhận từ máy chủ.`}</p>}

        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-muted)] rounded-full text-sm font-medium">
          <Package className="h-4 w-4" />
          Mã đơn hàng: #{order._id?.slice(-8).toUpperCase()}
        </div>
      </div>

      {/* Order Detail Card */}
      <div className="border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-background)] shadow-sm mb-8">

        {/* Items */}
        {items.length > 0 && (
          <div className="p-6 border-b border-[var(--color-border)]">
            <h2 className="font-heading font-bold text-base mb-4 flex items-center gap-2">
              <Package className="h-4 w-4" /> Sản phẩm đặt mua
            </h2>
            <div className="space-y-3">
              {items.map((item: any, idx: number) => {
                const product = item.product ?? item.productId ?? {}
                const name = product.name ?? item.name ?? `Sản phẩm ${idx + 1}`
                const qty = item.quantity ?? 1
                const price = item.price ?? product.price ?? 0
                return (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-[var(--color-foreground)]">
                      {name} <span className="text-[var(--color-muted-foreground)]">× {qty}</span>
                    </span>
                    <span className="font-medium">{formatVND(price * qty)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="p-6 border-b border-[var(--color-border)]">
          <div className="flex justify-between font-bold text-lg">
            <span>Tổng cộng</span>
            <span className="text-[var(--color-primary)]">{formatVND(totalPrice)}</span>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="p-6 border-b border-[var(--color-border)]">
          <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Địa chỉ giao hàng
          </h2>
          <div className="text-sm text-[var(--color-muted-foreground)] space-y-1">
            {shipping.fullName && <p className="font-medium text-[var(--color-foreground)]">{shipping.fullName}</p>}
            {shipping.phone && <p>{shipping.phone}</p>}
            {(shipping.address || shipping.street) && <p>{shipping.address ?? shipping.street}</p>}
            {shipping.province && <p>{shipping.province}</p>}
            {shipping.city && <p>{shipping.city}</p>}
          </div>
        </div>

        {/* Payment Method */}
        <div className="p-6">
          <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Phương thức thanh toán
          </h2>
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            {order.paymentMethod === 'COD' ? (
              <Truck className="h-4 w-4" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {formatPaymentMethod(order.paymentMethod)}
          </div>
          <p className="mt-3 text-sm">Trạng thái thanh toán: <strong>{payment?.paymentStatus || order.paymentStatus || 'PENDING'}</strong></p>
          {payment?.transactionId && <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Mã giao dịch: {payment.transactionId}</p>}
          {payment?.failureReason && <p className="mt-2 text-sm text-red-700">{payment.failureReason}</p>}
          {pollingDone && payment?.paymentStatus === 'PENDING' && <div className="mt-3"><p className="text-sm">Chưa nhận được kết quả thanh toán.</p><Button className="mt-2" variant="outline" onClick={refreshPayment}>Kiểm tra lại</Button></div>}
        </div>

        {payment?.transfer && payment.paymentStatus !== 'PAID' && <div className="border-t border-[var(--color-border)] p-6">
          <h2 className="font-heading font-bold">Thanh toán chuyển khoản</h2>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start"><img src={payment.transfer.qrCodeUrl} alt="VietQR payment code" className="h-52 w-52 rounded border object-contain"/><div className="space-y-2 text-sm"><p>Ngân hàng: <strong>{payment.transfer.bankName}</strong></p><p>Số tài khoản: <strong>{payment.transfer.accountNumber}</strong> <button className="ml-2 underline" onClick={() => navigator.clipboard.writeText(payment.transfer.accountNumber)}>Sao chép</button></p><p>Tên tài khoản: <strong>{payment.transfer.accountName}</strong></p><p>Số tiền: <strong>{formatVND(payment.transfer.amount)}</strong></p><p>Nội dung: <strong>{payment.transfer.paymentContent}</strong> <button className="ml-2 underline" onClick={() => navigator.clipboard.writeText(payment.transfer.paymentContent)}>Sao chép</button></p><p className="pt-2 text-amber-700">Đang chờ ngân hàng xác nhận…</p></div></div>
        </div>}

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {actionError && <p role="alert" className="text-red-700">{actionError}</p>}
        {payment && (['FAILED','EXPIRED','CANCELLED'].includes(payment.paymentStatus) || (order.paymentMethod === 'MOMO' && payment.paymentStatus === 'PENDING')) && <Button variant="outline" size="lg" className="flex-1" loading={retrying} onClick={retryPayment}>{order.paymentMethod === 'MOMO' && payment.paymentStatus === 'PENDING' ? 'Tiếp tục thanh toán MoMo' : 'Thử lại thanh toán'}</Button>}
        <Button
          variant="outline"
          size="lg"
          className="flex-1 uppercase font-semibold tracking-wider"
          onClick={() => navigate('/orders')}
        >
          Xem đơn hàng
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1 uppercase font-semibold tracking-wider"
          onClick={() => navigate('/products')}
        >
          Tiếp tục mua sắm
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

    </div>
  )
}
