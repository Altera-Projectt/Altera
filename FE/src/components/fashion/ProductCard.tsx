import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import type { Product } from '@/types/product.types'
import { formatVND } from '@/utils/format'
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
        'group relative flex flex-col overflow-hidden bg-transparent transition-all duration-300',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-muted)] rounded-[var(--radius-md)]">
        <Link to={`/products/${product._id}`} aria-label={`View details of ${product.name}`}>
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Wishlist Button - Top Right */}
        <div className="absolute top-3 right-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
          <button
            type="button"
            onClick={handleWishlist}
            disabled={wishlisting}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm transition-all hover:scale-110',
              localWishlisted
                ? 'text-rose-500'
                : 'text-[var(--color-foreground)] hover:text-rose-500'
            )}
            aria-label={localWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            {wishlisting ? (
              <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart className={cn('h-4 w-4', localWishlisted && 'fill-current')} />
            )}
          </button>
        </div>

        {/* Quick Add Button - Bottom full width slide up */}
        <div className="absolute bottom-0 left-0 w-full translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className="w-full flex h-10 items-center justify-center gap-2 bg-white/90 backdrop-blur-md text-black font-semibold text-xs uppercase tracking-wider transition-colors hover:bg-black hover:text-white disabled:opacity-50"
            aria-label="Quick Add to Cart"
          >
            {adding ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Quick Add
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col pt-4 pb-2">
        <div className="flex items-start justify-between gap-4">
          <Link
            to={`/products/${product._id}`}
            className="font-heading text-base font-bold text-[var(--color-foreground)] hover:opacity-70 transition-opacity line-clamp-1"
          >
            {product.name}
          </Link>
          <span className="font-body text-sm font-semibold whitespace-nowrap">
            {formatVND(product.price)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
          <span className="uppercase tracking-widest">{product.category}</span>
        </div>
      </div>
    </div>
  )
}

