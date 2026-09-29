import { Link } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { formatPrice } from '@/utils/format'
import { CartService } from '@/services/cart.api'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'
import type { Product } from '@/types/product.types'

interface ProductCardProps {
  product: Product
  className?: string
  onWishlistToggle?: (productId: string) => void
  isWishlisted?: boolean
}

export function ProductCard({
  product, className, onWishlistToggle, isWishlisted = false
}: ProductCardProps) {

  const { fetchCart } = useCartStore()
  const [adding, setAdding] = useState(false)
  const [wishlisted, setWishlisted] = useState(isWishlisted)
  const [imgIndex, setImgIndex] = useState(0)

  // Lấy ảnh từ images[] hoặc fallback imageUrl
  const images = product.images?.length
    ? product.images
    : [product.imageUrl].filter(Boolean)
  const mainImage = images[imgIndex] || product.imageUrl
  const hoverImage = images[1] || null

  // Tính % giảm giá
  const discountPercent = product.discountPrice && product.price
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : null

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (adding) return
    try {
      setAdding(true)
      await CartService.addToCart({ productId: product._id, quantity: 1 })
      await fetchCart()
      toast.success(`Đã thêm "${product.name}" vào giỏ hàng`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Thêm vào giỏ thất bại')
    } finally {
      setAdding(false)
    }
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlisted(!wishlisted)
    onWishlistToggle?.(product._id)
  }

  return (
    <div className={cn('group relative flex flex-col', className)}>

      {/* ── Image Container ── */}
      <Link
        to={`/products/${product._id}`}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-[var(--color-muted)]"
        onMouseEnter={() => hoverImage && setImgIndex(1)}
        onMouseLeave={() => setImgIndex(0)}
      >
        {/* Main image — scales subtly, crossfades to hover */}
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className={cn(
              'absolute inset-0 h-full w-full object-cover',
              'transition-all duration-700 ease-out',
              hoverImage
                ? 'group-hover:opacity-0 group-hover:scale-[1.04]'
                : 'group-hover:scale-[1.04]',
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--color-muted)]">
            <span className="text-xs text-[var(--color-muted-foreground)]">No image</span>
          </div>
        )}

        {/* Hover image (images[1]) — fades in */}
        {hoverImage && (
          <img
            src={hoverImage}
            alt={`${product.name} — alternate view`}
            className="absolute inset-0 h-full w-full object-cover opacity-0 scale-[1.04] transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-100"
          />
        )}

        {/* ── Top-left badges ──────────────────────────────────── */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discountPercent && (
            <span className="bg-[var(--color-accent)] text-[var(--color-foreground)] text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest">
              −{discountPercent}%
            </span>
          )}
          {product.isFeatured && !discountPercent && (
            <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest">
              NEW
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-[var(--color-muted-foreground)]/80 backdrop-blur-sm text-[var(--color-foreground)] text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest">
              SOLD OUT
            </span>
          )}
        </div>

        {/* ── Bottom-right action buttons (slide up on hover) ── */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-2 translate-y-3 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          {/* Wishlist */}
          <button
            type="button"
            onClick={handleWishlist}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full',
              'shadow-lg backdrop-blur-sm transition-all duration-200',
              wishlisted
                ? 'bg-[var(--color-accent)] text-[var(--color-foreground)]'
                : 'bg-black/60 text-white/80 hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]',
            )}
            aria-label="Thêm vào yêu thích"
          >
            <Heart className={cn('h-[14px] w-[14px]', wishlisted ? 'fill-current' : '')} />
          </button>

          {/* Add to cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:opacity-40"
            aria-label="Thêm vào giỏ hàng"
          >
            {adding ? (
              <div className="h-3.5 w-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <ShoppingBag className="h-[14px] w-[14px]" />
            )}
          </button>
        </div>
      </Link>

      {/* ── Product Info ────────────────────────────────────────── */}
      <div className="pt-3 pb-1">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            {/* Name */}
            <Link
              to={`/products/${product._id}`}
              className="block font-heading text-lg md:text-xl font-black text-black uppercase tracking-tight hover:text-[#0011FF] transition-colors line-clamp-2"
            >
              {product.name}
            </Link>
            
            {/* Author (Placeholder for now as requested) */}
            <p className="mt-1 text-[11px] font-medium text-black uppercase flex gap-1 items-baseline">
              <span>TÁC GIẢ:</span>
              <span className="font-light underline decoration-gray-400 underline-offset-4 text-gray-500">NGUYỄN VĂN B</span>
            </p>
          </div>

          {/* Price row */}
          <div className="text-right whitespace-nowrap mt-1">
            <span className="text-sm font-medium text-black">
              {formatPrice(product.discountPrice ?? product.price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
