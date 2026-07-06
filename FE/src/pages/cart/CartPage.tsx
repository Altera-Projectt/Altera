import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CartService } from '@/services/cart.api'
import { useCartStore } from '@/store/cartStore'
import { formatVND } from '@/utils/format'

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

  if (loading && !cart) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide mb-8">Shopping Cart</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-24 w-full bg-zinc-300 dark:bg-zinc-800 rounded-[var(--radius-md)]" />
          <div className="h-24 w-full bg-zinc-300 dark:bg-zinc-800 rounded-[var(--radius-md)]" />
        </div>
      </div>
    )
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-muted)]/30 mt-8">
        <ShoppingCart className="h-16 w-16 text-[var(--color-muted-foreground)] mb-6 opacity-50" />
        <h2 className="text-2xl font-bold font-heading mb-2">🛒 Your cart is empty</h2>
        <p className="text-[var(--color-muted-foreground)] mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Button asChild variant="primary" size="lg" className="uppercase font-semibold tracking-wider">
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide">Shopping Cart</h1>
        <div className="text-sm text-[var(--color-muted-foreground)] font-medium bg-[var(--color-muted)] px-3 py-1 rounded-full">
          {cart.totalItems} Items
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearCart} 
              disabled={!!updating}
              className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
            >
              Clear Cart
            </Button>
          </div>
          
          <div className="border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
            {(cart.items || []).map((item) => {
              const productId = item.productId?._id
              const isUpdating = updating === productId
              
              return (
                <div key={productId} className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-[var(--color-background)] border-b border-[var(--color-border)] last:border-0 relative transition-colors hover:bg-[var(--color-muted)]/10">
                  
                  {isUpdating && (
                    <div className="absolute inset-0 bg-black/5 dark:bg-black/20 z-10 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="h-24 w-24 shrink-0 bg-[var(--color-muted)] rounded-[var(--radius-md)] flex items-center justify-center border border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)] p-2 text-center overflow-hidden">
                    {item.productId?.imageUrl ? (
                      <img
                        src={item.productId.imageUrl}
                        alt={item.productId.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>No Image</span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 w-full text-center sm:text-left flex flex-col justify-center">
                    <h3 className="font-semibold text-base line-clamp-2">
                      {item.productId?.name || 'Unknown Product'}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                      Unit Price: {formatVND(item.price ?? item.productId?.price ?? 0)}
                    </p>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <div className="flex items-center border border-[var(--color-border)] rounded-[var(--radius-sm)] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(productId!, item.quantity - 1)}
                        disabled={isUpdating || item.quantity <= 1}
                        className="h-8 w-8 flex items-center justify-center bg-[var(--color-neutral)] hover:bg-[var(--color-muted)] disabled:opacity-50 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(productId!, item.quantity + 1)}
                        disabled={isUpdating}
                        className="h-8 w-8 flex items-center justify-center bg-[var(--color-neutral)] hover:bg-[var(--color-muted)] disabled:opacity-50 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(productId!)}
                      disabled={isUpdating}
                      className="h-8 w-8 flex items-center justify-center text-[var(--color-muted-foreground)] hover:text-rose-500 hover:bg-rose-500/10 rounded-[var(--radius-sm)] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 bg-[var(--color-background)] sticky top-24 shadow-sm">
            <h2 className="font-heading text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between text-[var(--color-muted-foreground)]">
                <span>Subtotal ({cart.totalItems} items)</span>
                <span className="font-medium text-[var(--color-foreground)]">{formatVND(cart.totalPrice || 0)}</span>
              </div>
              <div className="flex justify-between text-[var(--color-muted-foreground)]">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-4 mb-8">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-[var(--color-primary)]">{formatVND(cart.totalPrice || 0)}</span>
              </div>
            </div>

            <Button size="lg" className="w-full uppercase font-semibold tracking-wider h-14" onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
