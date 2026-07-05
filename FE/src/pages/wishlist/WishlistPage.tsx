import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { WishlistService, type WishlistProduct } from '@/services/wishlist.api'
import { CartService } from '@/services/cart.api'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/utils/format'
import { toast } from 'sonner'

// ── Component ──────────────────────────────────────────────────────────────

export function WishlistPage() {
  const { fetchCart } = useCartStore()
  const [products, setProducts] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await WishlistService.getWishlist()
      setProducts(response.data.data.wishlist.products || [])
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách yêu thích')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [])

  const handleRemove = async (productId: string) => {
    try {
      setRemoving(productId)
      await WishlistService.removeFromWishlist(productId)
      setProducts((prev) => prev.filter((p) => p._id !== productId))
      toast.success('Đã xóa khỏi danh sách yêu thích')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xóa thất bại, vui lòng thử lại')
    } finally {
      setRemoving(null)
    }
  }

  const handleAddToCart = async (productId: string) => {
    try {
      setAdding(productId)
      await CartService.addToCart({ productId, quantity: 1 })
      await fetchCart()
      toast.success('Đã thêm vào giỏ hàng!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Thêm vào giỏ hàng thất bại')
    } finally {
      setAdding(null)
    }
  }

  // ── Loading State ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide mb-8">
          Sản phẩm yêu thích
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] w-full bg-zinc-300 dark:bg-zinc-800 rounded-[var(--radius-md)] mb-3" />
              <div className="h-4 w-3/4 bg-zinc-300 dark:bg-zinc-800 rounded mb-2" />
              <div className="h-4 w-1/2 bg-zinc-300 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Error State ─────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center text-center">
        <Heart className="h-12 w-12 text-[var(--color-muted-foreground)] mb-4 opacity-40" />
        <p className="text-rose-500 font-medium mb-6">{error}</p>
        <Button onClick={() => fetchWishlist()} variant="outline">
          Thử lại
        </Button>
      </div>
    )
  }

  // ── Empty State ─────────────────────────────────────────────────────────

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide mb-8">
          Sản phẩm yêu thích
        </h1>
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-muted)]/30">
          <Heart className="h-16 w-16 text-[var(--color-muted-foreground)] mb-6 opacity-40" />
          <h2 className="text-2xl font-bold font-heading mb-2">Chưa có sản phẩm yêu thích</h2>
          <p className="text-[var(--color-muted-foreground)] mb-8 text-center max-w-xs">
            Bạn chưa thêm sản phẩm nào vào danh sách yêu thích. Hãy khám phá và lưu những sản phẩm bạn thích!
          </p>
          <Button asChild variant="primary" size="lg" className="uppercase font-semibold tracking-wider">
            <Link to="/products">Khám phá sản phẩm</Link>
          </Button>
        </div>
      </div>
    )
  }

  // ── Product Grid ────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide">
          Sản phẩm yêu thích
        </h1>
        <div className="text-sm text-[var(--color-muted-foreground)] font-medium bg-[var(--color-muted)] px-3 py-1 rounded-full">
          {products.length} sản phẩm
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const isRemoving = removing === product._id
          const isAdding = adding === product._id

          return (
            <div
              key={product._id}
              className="group relative flex flex-col overflow-hidden bg-[var(--color-background)] transition-all duration-300"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-muted)] rounded-[var(--radius-md)]">
                <Link to={`/products/${product._id}`}>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-muted-foreground)]">
                      No Image
                    </div>
                  )}
                </Link>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                <div className="absolute bottom-3 right-3 flex flex-col gap-2 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {/* Remove from wishlist */}
                  <button
                    type="button"
                    onClick={() => handleRemove(product._id)}
                    disabled={isRemoving}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-500 border border-rose-200 shadow-sm hover:bg-rose-500 hover:text-white hover:border-transparent transition-colors disabled:opacity-50"
                    title="Xóa khỏi yêu thích"
                  >
                    {isRemoving ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                  {/* Add to cart */}
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product._id)}
                    disabled={isAdding || product.stock === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-background)] text-[var(--color-foreground)] border border-[var(--color-border)] shadow-sm hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)] hover:border-transparent transition-colors disabled:opacity-50"
                    title="Thêm vào giỏ hàng"
                  >
                    {isAdding ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ShoppingBag className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col pt-3 pb-2">
                <div className="flex items-start justify-between gap-2">
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
                  {product.stock === 0 && (
                    <span className="text-rose-500 font-medium">Hết hàng</span>
                  )}
                </div>
                {/* Remove button (always visible) */}
                <button
                  type="button"
                  onClick={() => handleRemove(product._id)}
                  disabled={isRemoving}
                  className="mt-2 text-xs text-[var(--color-muted-foreground)] hover:text-rose-500 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                  Xóa khỏi yêu thích
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
