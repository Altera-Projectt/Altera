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
    return <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 text-center text-[var(--color-error)]">Invalid Product ID</div>
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-[3/4] w-full animate-pulse bg-[var(--color-muted)] rounded-none" />
          <div className="space-y-6 pt-8">
            <div className="h-4 w-1/4 animate-pulse bg-[var(--color-muted)]" />
            <div className="h-8 w-3/4 animate-pulse bg-[var(--color-muted)]" />
            <div className="h-6 w-1/4 animate-pulse bg-[var(--color-muted)]" />
            <div className="h-24 w-full animate-pulse bg-[var(--color-muted)] mt-8" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-[var(--color-error)] mb-6 font-medium">{error || 'Product not found'}</p>
        <Button variant="outline" onClick={() => navigate('/products')}>
          Back to Products
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 pt-[var(--spacing-navbar)] pb-16">
      <div className="lg:grid lg:grid-cols-[60fr_40fr] lg:gap-16 lg:items-start">

        {/* ── CỘT TRÁI: Image Gallery ── */}
        <div className="flex flex-col gap-3">
          {/* Ảnh chính lớn */}
          {product.images && product.images.length > 0 ? (
            product.images.map((img, i) => (
              <div key={i} className="aspect-[3/4] w-full overflow-hidden bg-[var(--color-muted)]">
                <img
                  src={img}
                  alt={`${product.name} - ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="aspect-[3/4] w-full bg-[var(--color-muted)] flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm text-[var(--color-muted-foreground)]">No image</span>
              )}
            </div>
          )}
        </div>

        {/* ── CỘT PHẢI: Product Info (STICKY) ── */}
        <div className="sticky top-24 h-fit mt-6 lg:mt-0">

          {/* Category + Style */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              {product.category}
            </span>
            {product.style && (
              <>
                <span className="text-[var(--color-border)]">·</span>
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                  {product.style}
                </span>
              </>
            )}
          </div>

          {/* Name */}
          <h1 className="heading-brand text-2xl md:text-4xl mb-4">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-2xl font-black">
              {formatPrice(product.discountPrice ?? product.price)}
            </span>
            {product.discountPrice && product.price > product.discountPrice && (
              <>
                <span className="text-base text-[var(--color-muted-foreground)] line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs font-bold text-[var(--color-accent)] uppercase">
                  -{Math.round((1 - product.discountPrice / product.price) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Color Selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest mb-3">
                Màu sắc
                {selectedColor && (
                  <span className="ml-2 font-normal normal-case tracking-normal text-[var(--color-muted-foreground)]">
                    — {selectedColor.name}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-3">
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
                        'h-8 w-8 rounded-full transition-all duration-200 hover:scale-110',
                        selectedColor?.name === c.name ? 'ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110' : ''
                      )}
                      style={{
                        backgroundColor: c.hex,
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest">Size</p>
                <button className="text-xs underline underline-offset-2 text-[var(--color-muted-foreground)] hover:opacity-70">
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
                        'min-w-[48px] h-10 px-3 text-xs font-bold uppercase border transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed',
                        selectedSize?.label === s.label
                          ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)]'
                          : 'bg-transparent border-[var(--color-border)] hover:border-[var(--color-foreground)]'
                      )}
                    >
                      {s.label}
                      {s.stock < 5 && s.stock > 0 && (
                        <span className="block text-[8px] font-normal text-[var(--color-accent)]">
                          Còn {s.stock}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Size measurements tooltip */}
              {selectedSize?.measurements && (
                <div className="mt-3 p-3 bg-[var(--color-muted)] text-xs text-[var(--color-muted-foreground)] grid grid-cols-3 gap-2">
                  {selectedSize.measurements.chest && (
                    <div className="text-center">
                      <p className="font-bold text-[var(--color-foreground)]">{selectedSize.measurements.chest}</p>
                      <p>Ngực (cm)</p>
                    </div>
                  )}
                  {selectedSize.measurements.length && (
                    <div className="text-center">
                      <p className="font-bold text-[var(--color-foreground)]">{selectedSize.measurements.length}</p>
                      <p>Dài (cm)</p>
                    </div>
                  )}
                  {selectedSize.measurements.shoulder && (
                    <div className="text-center">
                      <p className="font-bold text-[var(--color-foreground)]">{selectedSize.measurements.shoulder}</p>
                      <p>Vai (cm)</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Material + Gender */}
          {(product.material || product.gender) && (
            <div className="mb-6 flex gap-4 text-xs text-[var(--color-muted-foreground)]">
              {product.material && <span>Chất liệu: <strong className="text-[var(--color-foreground)]">{product.material}</strong></span>}
              {product.gender && <span>Giới tính: <strong className="text-[var(--color-foreground)]">{product.gender}</strong></span>}
            </div>
          )}

          {/* Add to Cart */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="lg"
              className="flex-1 rounded-none uppercase tracking-widest font-bold"
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
            >
              {product.stock === 0 ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-none border-[var(--color-border)]"
              onClick={handleWishlist}
            >
              <Heart className={cn('h-5 w-5', isWishlisted ? 'fill-current text-[var(--color-accent)]' : '')} />
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
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)] border border-[var(--color-border)] px-2 py-0.5">
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
