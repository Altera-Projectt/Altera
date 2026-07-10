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
        {/* Main image */}
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-all duration-500',
              hoverImage ? 'group-hover:opacity-0' : ''
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs text-[var(--color-muted-foreground)]">No image</span>
          </div>
        )}

        {/* Hover image (images[1]) */}
        {hoverImage && (
          <img
            src={hoverImage}
            alt={`${product.name} - alternate view`}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:opacity-100"
          />
        )}

        {/* ── Badges góc trên trái ── */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discountPercent && (
            <span className="bg-[var(--color-accent)] text-white text-[10px] font-bold
              px-2 py-0.5 uppercase tracking-wider">
              -{discountPercent}%
            </span>
          )}
          {product.isFeatured && !discountPercent && (
            <span className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)]
              text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
              HOT
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-[var(--color-muted-foreground)] text-white
              text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
              HẾT HÀNG
            </span>
          )}
        </div>

        {/* ── Action buttons góc phải ── */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-2
          translate-y-2 opacity-0 transition-all duration-300
          group-hover:translate-y-0 group-hover:opacity-100">

          {/* Wishlist */}
          <button
            type="button"
            onClick={handleWishlist}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full shadow-md',
              'border transition-colors duration-200',
              wishlisted
                ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                : 'bg-white border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] hover:text-white'
            )}
            aria-label="Thêm vào yêu thích"
          >
            <Heart className={cn('h-4 w-4', wishlisted ? 'fill-current' : '')} />
          </button>

          {/* Add to cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full shadow-md
              bg-[var(--color-primary)] text-[var(--color-primary-foreground)]
              hover:opacity-80 transition-opacity disabled:opacity-40"
            aria-label="Thêm vào giỏ hàng"
          >
            {adding ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
          </button>
        </div>
      </Link>

      {/* ── Product Info ── */}
      <div className="pt-3 pb-2">

        {/* Style badge + category */}
        <div className="flex items-center gap-2 mb-1">
          {product.style && (
            <span className="text-[10px] font-semibold uppercase tracking-widest
              text-[var(--color-muted-foreground)]">
              {product.style}
            </span>
          )}
          {product.style && product.category && (
            <span className="text-[var(--color-border)]">·</span>
          )}
          <span className="text-[10px] font-medium uppercase tracking-widest
            text-[var(--color-muted-foreground)]">
            {product.category}
          </span>
        </div>

        {/* Name */}
        <Link
          to={`/products/${product._id}`}
          className="block text-sm font-semibold uppercase tracking-wide
            text-[var(--color-foreground)] hover:opacity-70 transition-opacity
            line-clamp-1"
        >
          {product.name}
        </Link>

        {/* Price */}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--color-foreground)]">
            {formatPrice(product.discountPrice ?? product.price)}
          </span>
          {product.discountPrice && product.price > product.discountPrice && (
            <span className="text-xs text-[var(--color-muted-foreground)] line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* ── Color Swatches ── */}
        {product.colors && product.colors.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {product.colors.slice(0, 5).map((color) => (
              <div
                key={color.name}
                title={color.name}
                className="h-3.5 w-3.5 rounded-full border border-[var(--color-border)]
                  cursor-pointer hover:scale-125 transition-transform duration-150
                  flex-shrink-0"
                style={{
                  backgroundColor: color.hex,
                  borderColor: color.hex === '#F5F5F5' || color.hex === '#FFFFFF'
                    ? '#D1D5DB' : 'transparent',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
                }}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-[10px] text-[var(--color-muted-foreground)]">
                +{product.colors.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
