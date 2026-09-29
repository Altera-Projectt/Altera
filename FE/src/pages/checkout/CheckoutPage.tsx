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
    let createdOrderId: string | undefined
    if (!cartItems || cartItems.length === 0) {
      toast.error('Giỏ hàng của bạn đang trống!')
      return
    }

    try {
      setSubmitting(true)
      const checkoutKey = sessionStorage.getItem('altera-checkout-key') || crypto.randomUUID()
      sessionStorage.setItem('altera-checkout-key', checkoutKey)
      const response = await OrderService.createOrder({
        items: cartItems.map((item) => ({
          productId: item.productId._id,
          quantity: item.quantity,
          ...(item._id && { cartItemId: item._id }),
        })),
        shippingAddress: {
          fullName: values.fullName,
          phone: values.phone,
          street: values.address,
          city: '',
          province: '',
          country: 'Vietnam',
        },
        paymentMethod,
        checkoutKey,
      })

      const order = response.data.data
      const orderId = (order as any)?._id || (order as any)?.order?._id
      createdOrderId = orderId
      sessionStorage.removeItem('altera-checkout-key')

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
      const message = err?.response?.data?.message || 'Đặt hàng thất bại, vui lòng thử lại!'
      toast.error(message)
      if (createdOrderId) navigate(`/orders/success/${createdOrderId}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (cartItems.length === 0 && !cart) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="h-20 w-20 rounded-full border border-[var(--color-border)] flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-[var(--color-border)]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
              ALTERA — Cart
            </p>
            <h1 className="heading-brand text-3xl mb-2">Giỏ hàng trống</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Bạn chưa có sản phẩm nào trong giỏ hàng.
            </p>
          </div>
          <Button asChild variant="primary" size="lg">
            <Link to="/products">Khám phá sản phẩm</Link>
          </Button>
        </div>
      </div>
    )
  }

  // ── Payment method options ─────────────────────────────────────────────

  const PAYMENT_OPTIONS: {
    value: PaymentMethod
    label: string
    sub: string
    icon: React.ReactNode
  }[] = [
    {
      value: 'COD',
      label: 'Thanh toán khi nhận hàng',
      sub: 'Trả tiền mặt trực tiếp khi giao hàng — không cần thẻ.',
      icon: <Truck className="h-6 w-6" />,
    },
    {
      value: 'BANK_TRANSFER',
      label: 'Chuyển khoản ngân hàng',
      sub: 'Chuyển khoản trước — nhận thông tin tài khoản sau khi đặt.',
      icon: <CreditCard className="h-6 w-6" />,
    },
  ]

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">

      {/* ── Page header ── */}
      <div className="mb-10">
        <button
          type="button"
          onClick={() => navigate('/cart')}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại giỏ hàng
        </button>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
          ALTERA — Checkout
        </p>
        <h1 className="heading-brand text-4xl md:text-5xl">Thanh Toán</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">

          {/* ── Left — Steps ── */}
          <div className="space-y-4">

            {/* ── Step 1: Address ── */}
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
              {/* Step header */}
              <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--color-border)]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black text-xs font-black">
                  1
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                    Thông tin giao hàng
                  </p>
                </div>
              </div>

              {/* Step body */}
              <div className="px-6 py-6 space-y-5">
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
                  label="Địa chỉ giao hàng"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  required
                  error={errors.address?.message}
                  {...register('address')}
                />
              </div>
            </div>

            {/* ── Step 2: Payment Method ── */}
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
              {/* Step header */}
              <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--color-border)]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black text-xs font-black">
                  2
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                    Phương thức thanh toán
                  </p>
                </div>
              </div>

              {/* Payment cards grid */}
              <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PAYMENT_OPTIONS.map((opt) => {
                  const isSelected = paymentMethod === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={[
                        'relative flex flex-col items-start gap-4 p-5 rounded-[var(--radius-lg)] border-2 text-left',
                        'transition-all duration-200 cursor-pointer',
                        isSelected
                          ? 'border-white bg-white/[0.05] shadow-[0_0_20px_rgba(255,255,255,0.04)]'
                          : 'border-[var(--color-border)] bg-transparent hover:border-white/30 hover:bg-white/[0.03]',
                      ].join(' ')}
                      aria-pressed={isSelected}
                    >
                      {/* Check badge */}
                      {isSelected && (
                        <CheckCircle className="absolute top-4 right-4 h-4 w-4 text-[var(--color-foreground)]" />
                      )}

                      {/* Icon block */}
                      <div className={[
                        'flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)]',
                        'transition-colors duration-200 shrink-0',
                        isSelected
                          ? 'bg-white text-black'
                          : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
                      ].join(' ')}>
                        {opt.icon}
                      </div>

                      {/* Text */}
                      <div>
                        <p className={[
                          'text-sm font-bold leading-tight',
                          isSelected ? 'text-[var(--color-foreground)]' : 'text-[var(--color-foreground)]',
                        ].join(' ')}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-1 leading-relaxed">
                          {opt.sub}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>

          {/* ── Right — Order Summary (sticky) ── */}
          <div className="sticky top-[calc(var(--spacing-navbar)+2rem)]">
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">

              {/* Summary header */}
              <div className="px-6 py-5 border-b border-[var(--color-border)]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                  Tóm tắt đơn hàng
                </p>
              </div>

              {/* Cart items */}
              <div className="px-6 py-5 space-y-4 max-h-64 overflow-y-auto scrollbar-none">
                {cartItems.map((item) => {
                  const productId = item.productId?._id
                  return (
                    <div key={item._id ?? productId} className="flex items-center gap-3">
                      <div className="h-14 w-14 flex-shrink-0 rounded-[var(--radius-md)] bg-[var(--color-muted)] border border-[var(--color-border)] overflow-hidden">
                        {(typeof item.marketplaceDesignId === 'object' ? item.marketplaceDesignId?.thumbnail : null) || item.productId?.imageUrl ? (
                          <img
                            src={(typeof item.marketplaceDesignId === 'object' && item.marketplaceDesignId?.thumbnail) || item.productId.imageUrl}
                            alt={(typeof item.marketplaceDesignId === 'object' && item.marketplaceDesignId?.name) || item.productId.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ShoppingBag className="h-4 w-4 text-[var(--color-border)]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{(typeof item.marketplaceDesignId === 'object' && item.marketplaceDesignId?.name) || item.productId?.name}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">SL: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap">
                        {formatVND((item.price ?? item.productId?.price ?? 0) * item.quantity)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Pricing breakdown */}
              <div className="px-6 py-5 border-t border-[var(--color-border)] space-y-3 text-sm">
                <div className="flex justify-between text-[var(--color-muted-foreground)]">
                  <span>Tạm tính</span>
                  <span className="font-medium text-[var(--color-foreground)]">{formatVND(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-[var(--color-muted-foreground)]">
                  <span>Phí vận chuyển</span>
                  <span>Tính khi xác nhận</span>
                </div>
              </div>

              {/* Total */}
              <div className="px-6 py-5 border-t border-[var(--color-border)]">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                    Tổng cộng
                  </span>
                  <span className="text-xl font-black text-[var(--color-foreground)]">{formatVND(totalPrice)}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="px-6 pb-6">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full uppercase font-bold tracking-widest gap-2"
                  loading={submitting}
                  disabled={submitting || cartItems.length === 0}
                >
                  {!submitting && <ShoppingBag className="h-4 w-4" />}
                  {submitting ? 'Đang đặt hàng...' : 'Đặt hàng ngay'}
                </Button>

                <p className="text-[10px] text-center text-[var(--color-muted-foreground)] mt-4 leading-relaxed">
                  Bằng cách đặt hàng, bạn đồng ý với{' '}
                  <span className="underline underline-offset-2 cursor-pointer hover:text-[var(--color-foreground)] transition-colors">
                    Điều khoản sử dụng
                  </span>{' '}
                  của ALTERA
                </p>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
