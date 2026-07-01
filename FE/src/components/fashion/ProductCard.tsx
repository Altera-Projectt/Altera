import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import type { Product } from '@/types/product.types'
import { formatPrice } from '@/utils/format'
import { cn } from '@/utils/cn'
import { CartService } from '@/services/cart.api'
import { WishlistService } from '@/services/wishlist.api'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
  className?: string
  /** Whether this product is in the user's wishlist */
  isWishlisted?: boolean
  /** Callback when wishlist state changes */
  onWishlistChange?: (productId: string, wishlisted: boolean) => void
}

export function ProductCard({ product, className, isWishlisted = false, onWishlistChange }: ProductCardProps) {
  const imageUrl = product.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'
  const { fetchCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const [wishlisting, setWishlisting] = useState(false)
  const [localWishlisted, setLocalWishlisted] = useState(isWishlisted)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (adding) return

    try {
      setAdding(true)
      await CartService.addToCart({ productId: product._id, quantity: 1 })
      await fetchCart()
      toast.success('Added to cart successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add to cart')
    } finally {
      setAdding(false)
    }
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      navigate('/auth/login')
      return
    }

    if (wishlisting) return

    try {
      setWishlisting(true)
      if (localWishlisted) {
        await WishlistService.removeFromWishlist(product._id)
        setLocalWishlisted(false)
        toast.success('Đã xóa khỏi danh sách yêu thích')
        onWishlistChange?.(product._id, false)
      } else {
        await WishlistService.addToWishlist(product._id)
        setLocalWishlisted(true)
        toast.success('Đã thêm vào danh sách yêu thích')
        onWishlistChange?.(product._id, true)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại, vui lòng thử lại')
    } finally {
      setWishlisting(false)
    }
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden bg-[var(--color-background)] transition-all duration-300',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-muted)]">
        <Link to={`/products/${product._id}`} aria-label={`View details of ${product.name}`}>
          <div className="flex h-full w-full items-center justify-center bg-[var(--color-muted)] text-sm font-medium text-[var(--color-muted-foreground)]">
            Upload image
          </div>
        </Link>



        <div className="absolute bottom-4 right-4 flex flex-col gap-2 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {/* Wishlist button */}
          <button
            type="button"
            onClick={handleWishlist}
            disabled={wishlisting}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-colors',
              localWishlisted
                ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'
                : 'bg-[var(--color-background)] text-[var(--color-foreground)] border-[var(--color-border)] hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200'
            )}
            aria-label={localWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            {wishlisting ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart className={cn('h-4.5 w-4.5', localWishlisted && 'fill-current')} />
            )}
          </button>

          {/* Add to cart button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-background)] text-[var(--color-foreground)] border border-[var(--color-border)] shadow-sm hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)] hover:border-transparent transition-colors disabled:opacity-50"
            aria-label="Quick Add to Cart"
          >
            {adding ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShoppingBag className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col pt-4 pb-2">
        <div className="flex items-start justify-between gap-4">
          <Link
            to={`/products/${product._id}`}
            className="text-sm font-medium text-[var(--color-foreground)] hover:underline line-clamp-1"
          >
            {product.name}
          </Link>
          <span className="text-sm font-semibold whitespace-nowrap">
            {formatPrice(product.price)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
          <span>{product.category}</span>
        </div>
      </div>
    </div>
  )
}

