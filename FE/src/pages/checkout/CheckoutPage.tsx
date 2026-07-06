import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShoppingBag, MapPin, CreditCard, Truck, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CartService } from '@/services/cart.api'
import { OrderService } from '@/services/order.api'
import { useCartStore } from '@/store/cartStore'
import { formatVND } from '@/utils/format'
import { toast } from 'sonner'
import type { CartItem } from '@/types/cart.types'
import type { PaymentMethod } from '@/types/order.types'

// ── Validation Schema ──────────────────────────────────────────────────────

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải ít nhất 2 ký tự'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ').max(15, 'Số điện thoại không hợp lệ'),
  address: z.string().min(5, 'Địa chỉ phải ít nhất 5 ký tự'),
  city: z.string().min(2, 'Thành phố không được để trống'),
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

// ── Component ──────────────────────────────────────────────────────────────

export function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, fetchCart } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')
  const [submitting, setSubmitting] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [totalPrice, setTotalPrice] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
  })

  // Fetch cart on mount
  useEffect(() => {
    const loadCart = async () => {
      await fetchCart()
    }
    loadCart()
  }, [])

  // Sync local cart items
  useEffect(() => {
    if (cart) {
      setCartItems(cart.items || [])
      setTotalPrice(cart.totalPrice || 0)
    }
  }, [cart])

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!cartItems || cartItems.length === 0) {
      toast.error('Giỏ hàng của bạn đang trống!')
      return
    }

    try {
      setSubmitting(true)
      const response = await OrderService.createOrder({
        items: cartItems.map((item) => ({
          productId: item.productId._id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: values.fullName,
          phone: values.phone,
          address: values.address,
          city: values.city,
        },
        paymentMethod,
      })

      const order = response.data.data
      const orderId = (order as any)?._id || (order as any)?.order?._id

      // Clear cart
      try {
        await CartService.clearCart()
        await fetchCart()
      } catch {
        // silently ignore cart clear error
      }

      toast.success('Đặt hàng thành công!')
      navigate(`/orders/success/${orderId}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đặt hàng thất bại, vui lòng thử lại!')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (cartItems.length === 0 && !cart) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <ShoppingBag className="h-16 w-16 mx-auto text-[var(--color-muted-foreground)] opacity-40" />
          <h1 className="font-heading text-2xl font-bold">Giỏ hàng trống</h1>
          <p className="text-[var(--color-muted-foreground)]">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
          <Button asChild variant="primary">
            <Link to="/products">Khám phá sản phẩm</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại giỏ hàng
        </button>
      </div>

      <h1 className="font-heading text-3xl font-bold uppercase tracking-wide mb-10">Thanh Toán</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left — Form */}
          <div className="lg:col-span-2 space-y-10">

            {/* Shipping Info */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-bold">
                  1
                </div>
                <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Thông tin giao hàng
                </h2>
              </div>

              <div className="border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 space-y-5 bg-[var(--color-background)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Họ và tên"
                    placeholder="Nguyễn Văn A"
                    required
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />
                  <Input
                    label="Số điện thoại"
                    placeholder="0901234567"
                    type="tel"
                    required
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                </div>
                <Input
                  label="Địa chỉ"
                  placeholder="123 Đường ABC, Phường XYZ"
                  required
                  error={errors.address?.message}
                  {...register('address')}
                />
                <Input
                  label="Thành phố / Tỉnh"
                  placeholder="Hồ Chí Minh"
                  required
                  error={errors.city?.message}
                  {...register('city')}
                />
              </div>
            </section>

            {/* Payment Method */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-bold">
                  2
                </div>
                <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Phương thức thanh toán
                </h2>
              </div>

              <div className="space-y-3">
                {/* COD Option */}
                <label
                  htmlFor="payment-cod"
                  className={`flex items-center gap-4 p-5 rounded-[var(--radius-lg)] border-2 cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-muted-foreground)]'
                  }`}
                >
                  <input
                    id="payment-cod"
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="sr-only"
                  />
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === 'COD' ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'
                  }`}>
                    {paymentMethod === 'COD' && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <Truck className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                    <div>
                      <div className="font-semibold text-sm">Thanh toán khi nhận hàng (COD)</div>
                      <div className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Thanh toán bằng tiền mặt khi giao hàng</div>
                    </div>
                  </div>
                  {paymentMethod === 'COD' && (
                    <CheckCircle className="h-5 w-5 text-[var(--color-primary)] flex-shrink-0" />
                  )}
                </label>

                {/* Bank Transfer Option */}
                <label
                  htmlFor="payment-bank"
                  className={`flex items-center gap-4 p-5 rounded-[var(--radius-lg)] border-2 cursor-pointer transition-all ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-muted-foreground)]'
                  }`}
                >
                  <input
                    id="payment-bank"
                    type="radio"
                    name="paymentMethod"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === 'BANK_TRANSFER'}
                    onChange={() => setPaymentMethod('BANK_TRANSFER')}
                    className="sr-only"
                  />
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === 'BANK_TRANSFER' ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'
                  }`}>
                    {paymentMethod === 'BANK_TRANSFER' && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <CreditCard className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                    <div>
                      <div className="font-semibold text-sm">Chuyển khoản ngân hàng</div>
                      <div className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Chuyển khoản trước khi giao hàng</div>
                    </div>
                  </div>
                  {paymentMethod === 'BANK_TRANSFER' && (
                    <CheckCircle className="h-5 w-5 text-[var(--color-primary)] flex-shrink-0" />
                  )}
                </label>
              </div>
            </section>

          </div>

          {/* Right — Order Summary */}
          <div className="lg:col-span-1">
            <div className="border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 bg-[var(--color-background)] sticky top-24 shadow-sm">
              <h2 className="font-heading text-xl font-bold mb-6">Tóm tắt đơn hàng</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-1">
                {cartItems.map((item) => {
                  const productId = item.productId?._id
                  return (
                    <div key={productId} className="flex items-center gap-3">
                      <div className="h-14 w-14 flex-shrink-0 rounded-[var(--radius-md)] bg-[var(--color-muted)] border border-[var(--color-border)] overflow-hidden">
                        {item.productId?.imageUrl ? (
                          <img
                            src={item.productId.imageUrl}
                            alt={item.productId.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-[var(--color-muted-foreground)]">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.productId?.name}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">SL: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap">
                        {formatVND((item.price ?? item.productId?.price ?? 0) * item.quantity)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Pricing */}
              <div className="border-t border-[var(--color-border)] pt-4 space-y-3 text-sm mb-6">
                <div className="flex justify-between text-[var(--color-muted-foreground)]">
                  <span>Tạm tính</span>
                  <span className="font-medium text-[var(--color-foreground)]">{formatVND(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-[var(--color-muted-foreground)]">
                  <span>Phí vận chuyển</span>
                  <span>Tính khi xác nhận</span>
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] pt-4 mb-8">
                <div className="flex justify-between font-bold text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-[var(--color-primary)]">{formatVND(totalPrice)}</span>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full uppercase font-semibold tracking-wider h-14"
                loading={submitting}
                disabled={submitting || cartItems.length === 0}
              >
                {submitting ? 'Đang đặt hàng...' : 'Đặt hàng'}
              </Button>

              <p className="text-xs text-center text-[var(--color-muted-foreground)] mt-4">
                Bằng cách đặt hàng, bạn đồng ý với{' '}
                <span className="underline cursor-pointer">Điều khoản sử dụng</span> của ALTERA
              </p>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
