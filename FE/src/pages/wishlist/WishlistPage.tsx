import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MarketplaceService, type MarketplaceDesign } from '@/services/marketplace.api'
import api from '@/utils/axios'
import { formatVND, extractDesignLayers, optimizeImage, getLqipImage } from '@/utils/format'
import { ProgressiveImage } from '@/components/ui/ProgressiveImage'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ── Component ──────────────────────────────────────────────────────────────

export function WishlistPage() {
  // const { fetchCart } = useCartStore()
  const [products, setProducts] = useState<MarketplaceDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await MarketplaceService.getLikedDesigns()
      setProducts(response.data.data.designs || [])
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
      await api.request({ method: 'DELETE', url: `/designers/${productId}/like` })
      setProducts((prev) => prev.filter((p) => p._id !== productId))
      toast.success('Đã xóa khỏi danh sách yêu thích')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xóa thất bại, vui lòng thử lại')
    } finally {
      setRemoving(null)
    }
  }

  // ── Loading State ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
        <div className="mb-12">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
            ALTERA
          </p>
          <h1 className="heading-brand text-4xl md:text-5xl">My Wishlist</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] w-full bg-[var(--color-muted)] relative overflow-hidden mb-4">
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.04) 50%, transparent 80%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.8s ease-in-out infinite',
                  }}
                />
              </div>
              <div className="h-4 w-3/4 bg-[var(--color-muted)] rounded-sm mb-2" />
              <div className="h-4 w-1/2 bg-[var(--color-muted)] rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Error State ─────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center text-center gap-6">
        <div className="h-20 w-20 rounded-full border border-[var(--color-error)]/30 flex items-center justify-center">
          <Heart className="h-9 w-9 text-[var(--color-error)]/50" strokeWidth={1} />
        </div>
        <div>
          <h1 className="heading-brand text-3xl mb-2">Đã xảy ra lỗi</h1>
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        </div>
        <Button onClick={() => fetchWishlist()} variant="outline">
          Thử lại
        </Button>
      </div>
    )
  }

  // ── Empty State ─────────────────────────────────────────────────────────

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="h-24 w-24 rounded-full border border-[var(--color-border)] flex items-center justify-center">
            <Heart className="h-10 w-10 text-[var(--color-border)]" strokeWidth={1} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-3">
              ALTERA — Wishlist
            </p>
            <h1 className="heading-brand text-4xl mb-3">Your Collection is Empty</h1>
            <p className="text-sm text-[var(--color-muted-foreground)] max-w-sm mx-auto">
              You haven't saved any items yet. Discover our latest collections and curate your perfect wardrobe.
            </p>
          </div>
          <Button asChild variant="primary" size="lg" className="gap-2 uppercase font-bold tracking-widest mt-4">
            <Link to="/marketplace" className="flex items-center gap-2">
              Discover New Styles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  // ── Product Grid ────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mb-12 flex items-end justify-between"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">
            ALTERA
          </p>
          <h1 className="heading-brand text-4xl md:text-5xl">My Wishlist</h1>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          {products.length} {products.length === 1 ? 'item' : 'items'}
        </span>
      </motion.div>

      <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        <AnimatePresence>
          {products.map((product) => {
            const isRemoving = removing === product._id
            // const isAdding = adding === product._id

            return (
              <motion.div
                key={product._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="group relative flex flex-col"
              >
                {/* Image */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-muted)] mb-4">
                  <Link to={`/design/${product.slug}`}>
                    {product.thumbnail ? (
                      <>
                        <ProgressiveImage
                          src={optimizeImage(product.productId?.imageUrl || product.productId?.images?.[0] || product.thumbnail, 400)}
                          placeholderSrc={getLqipImage(product.productId?.imageUrl || product.productId?.images?.[0] || product.thumbnail)}
                          alt={product.name}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {(product.productId?.imageUrl || (product.productId?.images && product.productId.images.length > 0)) && (
                          <img
                            src={extractDesignLayers(product.thumbnail)}
                            alt={`${product.name} overlay`}
                            className="absolute inset-0 h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
                          />
                        )}
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-[var(--color-border)]" strokeWidth={1} />
                      </div>
                    )}
                  </Link>

                  {/* Gradient Overlay for hover state */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

                  {/* Absolute Actions */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemove(product._id)}
                      disabled={isRemoving}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-[var(--color-foreground)] hover:bg-[var(--color-error)] hover:text-[var(--color-foreground)] transition-all disabled:opacity-50"
                      title="Xóa khỏi yêu thích"
                    >
                      {isRemoving ? (
                        <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Add to Cart Overlay Button */}
                  <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <Button
                      asChild
                      variant="primary"
                      className="w-full text-[10px] uppercase font-bold tracking-widest bg-white text-black hover:bg-zinc-200"
                    >
                      <Link to={`/design/${product.slug}`}>
                        <ShoppingBag className="h-3.5 w-3.5 mr-2" />
                        Tùy chỉnh & Mua
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col px-1">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <Link
                      to={`/design/${product.slug}`}
                      className="text-xs font-bold text-[var(--color-foreground)] hover:underline line-clamp-1 uppercase tracking-wider"
                    >
                      {product.name}
                    </Link>
                    <span className="text-xs font-bold whitespace-nowrap text-[var(--color-muted-foreground)]">
                      {formatVND(product.price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)]">
                      {product.category || 'Custom Design'}
                    </span>
                    {product.designerId?.displayName && (
                      <span className="text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)] text-right">
                        BY {product.designerId.displayName}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
