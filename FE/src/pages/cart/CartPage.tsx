import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { CartService } from '@/services/cart.api'
import { useCartStore } from '@/store/cartStore'
import { formatVND } from '@/utils/format'

// ── Helpers ────────────────────────────────────────────────────────────────

const itemExit = {
  opacity: 0,
  x: -24,
  height: 0,
  marginBottom: 0,
  paddingTop: 0,
  paddingBottom: 0,
  transition: { duration: 0.3, ease: "easeOut" as any },
}

// ── Component ──────────────────────────────────────────────────────────────

export function CartPage() {
  const { cart, fetchCart, loading } = useCartStore()
  const navigate = useNavigate()
  const [updating, setUpdating] = useState<string | null>(null)

  // Refetch cart on mount
  useEffect(() => {
    fetchCart()
  }, [])

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return
    try {
      setUpdating(productId)
      await CartService.updateQuantity(productId, { quantity })
      await fetchCart()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  const handleRemoveItem = async (productId: string) => {
    try {
      setUpdating(productId)
      await CartService.removeItem(productId)
      await fetchCart()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  const handleClearCart = async () => {
    try {
      setUpdating('clear')
      await CartService.clearCart()
      await fetchCart()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  // ── Loading skeleton ───────────────────────────────────────────────────

  if (loading && !cart) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
            ALTERA
          </p>
          <h1 className="heading-brand text-4xl md:text-5xl">Shopping Cart</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-6 py-6 border-b border-[var(--color-border)]">
                <div className="h-24 w-24 shrink-0 bg-[var(--color-muted)] rounded-none relative overflow-hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.04) 50%, transparent 80%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.8s ease-in-out infinite',
                    }}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 bg-[var(--color-muted)] rounded-sm" />
                  <div className="h-3 w-1/3 bg-[var(--color-muted)] rounded-sm" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden lg:block h-64 bg-[var(--color-muted)] rounded-[var(--radius-xl)]" />
        </div>
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="h-24 w-24 rounded-full border border-[var(--color-border)] flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-[var(--color-border)]" strokeWidth={1} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-3">
              ALTERA — Cart
            </p>
            <h1 className="heading-brand text-4xl mb-3">Cart is Empty</h1>
            <p className="text-sm text-[var(--color-muted-foreground)] max-w-xs">
              You haven't added anything yet. Explore our collection and find something you love.
            </p>
          </div>
          <Button asChild variant="primary" size="lg" className="gap-2 uppercase font-bold tracking-widest">
            <Link to="/marketplace" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Shop
            </Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  // ── Main cart ─────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mb-10 flex items-end justify-between"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
            ALTERA
          </p>
          <h1 className="heading-brand text-4xl md:text-5xl">Shopping Cart</h1>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}
        </span>
      </motion.div>

      {/* ── Split-screen grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12 items-start">

        {/* ── LEFT — Cart items ── */}
        <div>
          {/* Column headers */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto] gap-4 pb-4 border-b border-[var(--color-border)]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">Product</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] text-center w-28">Quantity</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] text-right w-24">Total</span>
          </div>

          {/* Items with AnimatePresence */}
          <AnimatePresence initial={false}>
            {(cart.items || []).map((item) => {
              const productId = item.productId?._id
              const itemKey = item._id ?? productId
              const isUpdating = updating === itemKey
              const lineTotal = (item.price ?? item.productId?.price ?? 0) * item.quantity

              return (
                <motion.div
                  key={itemKey}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={itemExit}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className={[
                    'relative grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-4 items-center',
                    'py-6 border-b border-[var(--color-border)]',
                    'transition-opacity duration-200',
                    isUpdating ? 'opacity-40 pointer-events-none' : 'opacity-100',
                  ].join(' ')}>

                    {/* ── Product info ── */}
                    <div className="flex items-center gap-5">
                      {/* Thumbnail */}
                      <div className="h-20 w-20 shrink-0 overflow-hidden bg-[var(--color-muted)] border border-[var(--color-border)]">
                        {item.productId?.imageUrl ? (
                          <img
                            src={item.productId.imageUrl}
                            alt={item.productId.name}
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-[var(--color-border)]" strokeWidth={1} />
                          </div>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold line-clamp-2 leading-snug mb-1">
                          {item.productId?.name || 'Unknown Product'}
                        </h3>

                        {/* Customization pills */}
                        {item.customization && (
                          <div className="flex flex-wrap gap-2 mt-1.5 mb-1.5">
                            {item.customization.color?.name && (
                              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] border border-[var(--color-border)] px-2 py-0.5">
                                Color: {item.customization.color.name}
                              </span>
                            )}
                            {item.customization.size && (
                              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] border border-[var(--color-border)] px-2 py-0.5">
                                Size: {item.customization.size}
                              </span>
                            )}
                            {item.customization.printSide && (
                              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] border border-[var(--color-border)] px-2 py-0.5">
                                {item.customization.printSide}
                              </span>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          {formatVND(item.price ?? item.productId?.price ?? 0)} / unit
                        </p>

                        {/* Remove — visible on mobile */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(itemKey!)}
                          disabled={isUpdating}
                          className="mt-2 sm:hidden flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)] hover:text-[var(--color-error)] transition-colors"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    </div>

                    {/* ── Quantity stepper ── */}
                    <div className="flex items-center gap-3 w-28 justify-center">
                      {/* Minimalist stepper — thin border, no bg fill */}
                      <div className="flex items-center border border-[var(--color-border)] h-9">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(itemKey!, item.quantity - 1)}
                          disabled={isUpdating || item.quantity <= 1}
                          className="h-9 w-9 flex items-center justify-center text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(itemKey!, item.quantity + 1)}
                          disabled={isUpdating}
                          className="h-9 w-9 flex items-center justify-center text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Remove — desktop only */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(itemKey!)}
                        disabled={isUpdating}
                        className="hidden sm:flex h-9 w-9 items-center justify-center text-[var(--color-muted-foreground)] hover:text-[var(--color-error)] transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* ── Line total ── */}
                    <div className="w-24 text-right">
                      <span className="text-sm font-bold whitespace-nowrap">
                        {formatVND(lineTotal)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Clear cart link */}
          <div className="flex justify-between items-center pt-6">
            <Link
              to="/products"
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors group"
            >
              <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
              Continue Shopping
            </Link>
            <button
              type="button"
              onClick={handleClearCart}
              disabled={!!updating}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] hover:text-[var(--color-error)] transition-colors disabled:opacity-40"
            >
              <Trash2 className="h-3 w-3" />
              Clear Cart
            </button>
          </div>
        </div>

        {/* ── RIGHT — Order summary (sticky) ── */}
        <div className="sticky top-[calc(var(--spacing-navbar)+2rem)]">
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">

            {/* Summary header */}
            <div className="px-6 py-5 border-b border-[var(--color-border)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                Order Summary
              </p>
            </div>

            {/* Breakdown rows */}
            <div className="px-6 py-5 space-y-4 text-sm">
              <div className="flex justify-between text-[var(--color-muted-foreground)]">
                <span>Subtotal</span>
                <span className="font-medium text-[var(--color-foreground)]">
                  {formatVND(cart.totalPrice || 0)}
                </span>
              </div>
              <div className="flex justify-between text-[var(--color-muted-foreground)]">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-[var(--color-muted-foreground)]">
                <span>Discount</span>
                <span>—</span>
              </div>
            </div>

            {/* Total */}
            <div className="px-6 py-5 border-t border-[var(--color-border)]">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                  Estimated Total
                </span>
                <span className="text-xl font-black text-[var(--color-foreground)]">
                  {formatVND(cart.totalPrice || 0)}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="px-6 pb-6">
              <Button
                size="lg"
                className="w-full gap-2 uppercase font-bold tracking-widest"
                onClick={() => navigate('/checkout')}
                disabled={!!updating}
              >
                <ShoppingBag className="h-4 w-4" />
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>

              <p className="text-[10px] text-center text-[var(--color-muted-foreground)] mt-4 leading-relaxed">
                Taxes and shipping calculated at checkout
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
