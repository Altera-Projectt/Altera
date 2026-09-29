import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProductService } from '@/services/product.api'
import type { Product, ProductColor, ProductSize } from '@/types/product.types'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/utils/format'
import { Heart } from 'lucide-react'
import { CartService } from '@/services/cart.api'
import { WishlistService } from '@/services/wishlist.api'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
import { toast } from 'sonner'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { fetchCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [wishlisting, setWishlisting] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Variant selections
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null)
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await ProductService.getProduct(id)
        
        const productData = response.data.data.product
        setProduct(productData)
        if (productData.colors && productData.colors.length > 0) {
          setSelectedColor(productData.colors[0])
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load product details')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleAddToCart = async () => {
    if (adding || !product || product.stock === 0) return

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Vui lòng chọn Size')
      return
    }

    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error('Vui lòng chọn Màu sắc')
      return
    }

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

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login')
      return
    }
    if (wishlisting || !product) return
    try {
      setWishlisting(true)
      if (isWishlisted) {
        await WishlistService.removeFromWishlist(product._id)
        setIsWishlisted(false)
        toast.success('Đã xóa khỏi danh sách yêu thích')
      } else {
        await WishlistService.addToWishlist(product._id)
        setIsWishlisted(true)
        toast.success('Đã thêm vào danh sách yêu thích')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại')
    } finally {
      setWishlisting(false)
    }
  }

  if (!id) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 text-center text-[var(--color-error)]">
        Invalid Product ID
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 pt-[var(--spacing-navbar)] pb-16">
        <div className="lg:grid lg:grid-cols-[60fr_40fr] lg:gap-16">
          {/* Image col skeleton */}
          <div className="flex gap-3">
            <div className="hidden md:flex flex-col gap-2 w-16 shrink-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] w-full animate-pulse bg-[var(--color-muted)] rounded-[var(--radius-sm)]" />
              ))}
            </div>
            <div className="aspect-[3/4] flex-1 animate-pulse bg-[var(--color-muted)]" />
          </div>
          {/* Detail col skeleton */}
          <div className="mt-8 lg:mt-0 space-y-5 pt-4">
            <div className="h-3 w-1/4 animate-pulse bg-[var(--color-muted)]" />
            <div className="h-10 w-3/4 animate-pulse bg-[var(--color-muted)]" />
            <div className="h-6 w-1/4 animate-pulse bg-[var(--color-muted)]" />
            <div className="h-px w-full bg-[var(--color-border)] mt-6" />
            <div className="grid grid-cols-6 gap-2 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse bg-[var(--color-muted)]" />
              ))}
            </div>
            <div className="h-12 w-full animate-pulse bg-[var(--color-muted)] mt-4" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 text-center flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-[var(--color-error)] font-medium">{error || 'Product not found'}</p>
        <Button variant="outline" onClick={() => navigate('/products')}>
          ← Back to Products
        </Button>
      </div>
    )
  }

  // Derive images once
  const allImages = product.images?.length
    ? product.images
    : [product.imageUrl].filter(Boolean) as string[]

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 pt-[var(--spacing-navbar)] pb-20">
      <div className="lg:grid lg:grid-cols-[60fr_40fr] lg:gap-20 lg:items-start">

        {/* ── LEFT: Image Gallery ───────────────────────────────── */}
        <div className="flex gap-3">
          {/* Thumbnail rail (desktop only) */}
          {allImages.length > 1 && (
            <div className="hidden md:flex flex-col gap-2 w-[68px] shrink-0">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {}}
                  className={cn(
                    'aspect-[3/4] w-full overflow-hidden transition-all duration-200',
                    'ring-1',
                    i === 0
                      ? 'ring-white/60'
                      : 'ring-[var(--color-border)] opacity-60 hover:opacity-100 hover:ring-white/30',
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main image stack — all images stacked vertically (full editorial view) */}
          <div className="flex flex-col gap-2 flex-1">
            {allImages.length > 0 ? (
              allImages.map((img, i) => (
                <div key={i} className="aspect-[3/4] w-full overflow-hidden bg-[var(--color-muted)]">
                  <img
                    src={img}
                    alt={`${product.name} — ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                  />
                </div>
              ))
            ) : (
              <div className="aspect-[3/4] w-full bg-[var(--color-muted)] flex items-center justify-center">
                <span className="text-sm text-[var(--color-muted-foreground)]">No image</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Product Details (STICKY) ──────────────────── */}
        <div className="sticky top-[calc(var(--spacing-navbar)+2rem)] h-fit mt-10 lg:mt-0">

          {/* Breadcrumb meta */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              {product.category}
            </span>
            {product.style && (
              <>
                <span className="text-[var(--color-border)]">·</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                  {product.style}
                </span>
              </>
            )}
          </div>

          {/* Name */}
          <h1 className="heading-brand text-3xl md:text-4xl mb-5 leading-tight">
            {product.name}
          </h1>

          {/* Price block */}
          <div className="flex items-baseline gap-3 mb-7">
            <span className="text-2xl font-black text-[var(--color-foreground)]">
              {formatPrice(product.discountPrice ?? product.price)}
            </span>
            {product.discountPrice && product.price > product.discountPrice && (
              <>
                <span className="text-base text-[var(--color-muted-foreground)] line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest px-1.5 py-0.5 border border-[var(--color-accent)]/30 rounded-sm">
                  −{Math.round((1 - product.discountPrice / product.price) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          <div className="h-px w-full bg-[var(--color-border)] mb-7" />

          {/* Color Selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-7">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-[var(--color-muted-foreground)]">
                Màu sắc
                {selectedColor && (
                  <span className="ml-2 font-normal normal-case tracking-normal text-[var(--color-foreground)]">
                    — {selectedColor.name}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((color) => {
                  let c = color;
                  if (typeof c === 'string') {
                    try { c = JSON.parse(c) } catch (e) { c = { name: c, hex: c, stock: 10 } as unknown as ProductColor }
                  }

                  return (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      onClick={() => setSelectedColor(c)}
                      className={cn(
                        'h-10 w-10 rounded-full transition-all duration-200',
                        selectedColor?.name === c.name
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--color-background)] scale-110'
                          : 'ring-1 ring-black/10 hover:scale-105 hover:ring-white/40',
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-7">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                  Size
                </p>
                <button className="text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] underline underline-offset-2 transition-colors">
                  Hướng dẫn chọn size
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  let s = size;
                  if (typeof s === 'string') {
                    try { s = JSON.parse(s) } catch (e) { s = { label: s, stock: 10 } as unknown as ProductSize }
                  }

                  return (
                    <button
                      key={s.label}
                      type="button"
                      disabled={s.stock === 0}
                      onClick={() => setSelectedSize(s)}
                      className={cn(
                        'min-w-[48px] h-11 px-3 text-[10px] font-bold uppercase tracking-widest',
                        'border transition-all duration-150',
                        'disabled:opacity-25 disabled:cursor-not-allowed',
                        selectedSize?.label === s.label
                          ? 'bg-white text-black border-white'
                          : 'bg-transparent border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-white/60 hover:text-[var(--color-foreground)]',
                      )}
                    >
                      {s.label}
                      {s.stock < 5 && s.stock > 0 && (
                        <span className="block text-[8px] font-normal text-[var(--color-accent)]">
                          {s.stock} left
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Size measurements */}
              {selectedSize?.measurements && (
                <div className="mt-3 p-3 bg-[var(--color-muted)] rounded-[var(--radius-md)] grid grid-cols-3 gap-3">
                  {selectedSize.measurements.chest && (
                    <div className="text-center">
                      <p className="text-xs font-bold text-[var(--color-foreground)]">{selectedSize.measurements.chest}</p>
                      <p className="text-[10px] text-[var(--color-muted-foreground)]">Ngực (cm)</p>
                    </div>
                  )}
                  {selectedSize.measurements.length && (
                    <div className="text-center">
                      <p className="text-xs font-bold text-[var(--color-foreground)]">{selectedSize.measurements.length}</p>
                      <p className="text-[10px] text-[var(--color-muted-foreground)]">Dài (cm)</p>
                    </div>
                  )}
                  {selectedSize.measurements.shoulder && (
                    <div className="text-center">
                      <p className="text-xs font-bold text-[var(--color-foreground)]">{selectedSize.measurements.shoulder}</p>
                      <p className="text-[10px] text-[var(--color-muted-foreground)]">Vai (cm)</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Material + Gender meta */}
          {(product.material || product.gender) && (
            <div className="mb-7 flex gap-5 text-xs text-[var(--color-muted-foreground)]">
              {product.material && (
                <span>Chất liệu: <strong className="text-[var(--color-foreground)] font-medium">{product.material}</strong></span>
              )}
              {product.gender && (
                <span>Giới tính: <strong className="text-[var(--color-foreground)] font-medium">{product.gender}</strong></span>
              )}
            </div>
          )}

          {/* ── Add to Cart CTA ────────────────────────────────── */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="lg"
              className="flex-1 tracking-widest font-bold"
              onClick={handleAddToCart}
              loading={adding}
              disabled={adding || product.stock === 0}
            >
              {product.stock === 0 ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
              onClick={handleWishlist}
              disabled={wishlisting}
              aria-label={isWishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
            >
              <Heart className={cn('h-5 w-5 transition-all', isWishlisted ? 'fill-current text-[var(--color-accent)]' : '')} />
            </Button>
          </div>

          {/* Description */}
          <div className="mt-8 pt-8 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] uppercase tracking-widest text-[var(--color-muted-foreground)] border border-[var(--color-border)] px-2 py-1 rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
