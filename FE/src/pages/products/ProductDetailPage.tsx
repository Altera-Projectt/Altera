import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProductService } from '@/services/product.api'
import type { Product } from '@/types/product.types'
import { Button } from '@/components/ui/Button'
import { formatVND } from '@/utils/format'
import { ArrowLeft, ShoppingBag, Heart } from 'lucide-react'
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

  const handleAddToCart = async () => {
    if (adding || !product || product.stock === 0) return

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

  useEffect(() => {
    if (!id) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await ProductService.getProduct(id)
        
        // Correct path as per BE response: response.data.data.product
        const productData = response.data.data.product
        setProduct(productData)
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load product details')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  if (!id) {
    return <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 text-center text-rose-500">Invalid Product ID</div>
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-[3/4] w-full animate-pulse bg-zinc-300 dark:bg-zinc-800 rounded-[var(--radius-lg)]" />
          <div className="space-y-6 pt-8">
            <div className="h-4 w-1/4 animate-pulse bg-zinc-300 dark:bg-zinc-800" />
            <div className="h-8 w-3/4 animate-pulse bg-zinc-300 dark:bg-zinc-800" />
            <div className="h-6 w-1/4 animate-pulse bg-zinc-300 dark:bg-zinc-800" />
            <div className="h-24 w-full animate-pulse bg-zinc-300 dark:bg-zinc-800 mt-8" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-rose-500 mb-6 font-medium">{error || 'Product not found'}</p>
        <Button variant="outline" onClick={() => navigate('/products')}>
          Back to Products
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[80vh]">
      <button 
        onClick={() => navigate('/products')}
        className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to catalog
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
          <div className="flex h-full w-full items-center justify-center text-lg font-medium text-[var(--color-muted-foreground)] border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)]">
            Upload image
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col pt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
            {product.category}
          </div>
          <h1 className="font-heading text-3xl font-bold text-[var(--color-foreground)] sm:text-4xl">
            {product.name}
          </h1>
          
          <div className="mt-4 text-2xl font-medium">
            {formatVND(product.price)}
          </div>

          <div className="mt-8">
            <h3 className="font-heading font-semibold text-lg mb-3">Description</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          <div className="mt-8 flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] bg-[var(--color-muted)] w-fit px-3 py-1.5 rounded-full">
            <span className={`h-2 w-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </div>

          {/* Action */}
          <div className="mt-10 flex flex-col gap-3">
            <Button size="lg" className="w-full uppercase font-semibold tracking-wider h-14" disabled={product.stock === 0 || adding} onClick={handleAddToCart}>
              {adding ? (
                <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <ShoppingBag className="mr-2 h-5 w-5" />
              )}
              {product.stock > 0 ? (adding ? 'Adding...' : 'Add to Cart') : 'Out of Stock'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 font-semibold"
              disabled={wishlisting}
              onClick={handleWishlist}
            >
              {wishlisting ? (
                <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Heart className={cn('h-5 w-5', isWishlisted ? 'fill-rose-500 text-rose-500' : '')} />
              )}
              {isWishlisted ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
