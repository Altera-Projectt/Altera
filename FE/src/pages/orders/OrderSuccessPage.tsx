import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Package, MapPin, CreditCard, Truck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { OrderService } from '@/services/order.api'
import { formatVND } from '@/utils/format'
import type { Order } from '@/types/order.types'

// ── Helper to format payment method ───────────────────────────────────────

function formatPaymentMethod(method?: string) {
  if (method === 'COD') return 'Thanh toán khi nhận hàng (COD)'
  if (method === 'BANK_TRANSFER') return 'Chuyển khoản ngân hàng'
  return method || '—'
}

// ── Component ──────────────────────────────────────────────────────────────

export function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Không tìm thấy đơn hàng')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

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
        <h1 className="font-heading text-4xl font-bold mb-3">Đặt hàng thành công!</h1>
        <p className="text-[var(--color-muted-foreground)] text-lg">
          Cảm ơn bạn đã tin tưởng ALTERA. Đơn hàng của bạn đang được xử lý.
        </p>

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
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
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
