import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/fashion'
import { ProductService } from '@/services/product.api'
import type { Product } from '@/types/product.types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Product['category'] | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await ProductService.getProducts({
        search: search || undefined,
        category,
        page,
        limit: 12,
      })
      
      const { products, pagination } = response.data.data
      setProducts(products)
      setTotalPages(pagination.totalPages)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  // Debounce search slightly or just let useEffect handle it if we want instant fetch.
  // In a real app we'd use a useDebounce hook for search, but here we keep it simple.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, category, page])

  const categories: { label: string; value: Product['category'] | undefined }[] = [
    { label: 'All', value: undefined },
    { label: 'T-Shirts', value: 'T-Shirt' },
    { label: 'Shirts', value: 'SHIRT' },
  ]

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide">Catalog</h1>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Input 
            placeholder="Search products..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1) }} 
            className="w-full md:w-64"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <Button 
            key={cat.label} 
            variant={category === cat.value ? 'primary' : 'outline'}
            onClick={() => { setCategory(cat.value); setPage(1) }}
            className="whitespace-nowrap"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-4">
              <div className="aspect-[3/4] w-full animate-pulse rounded-[var(--radius-md)] bg-zinc-300 dark:bg-zinc-800" />
              <div className="h-4 w-2/3 animate-pulse bg-zinc-300 dark:bg-zinc-800" />
              <div className="h-4 w-1/3 animate-pulse bg-zinc-300 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-rose-500">
          <p>{error}</p>
          <Button onClick={() => fetchProducts()} className="mt-4">Retry</Button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-muted-foreground)]">
          No products found.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <Button 
                variant="outline" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <div className="font-medium text-sm">
                Page {page} of {totalPages}
              </div>
              <Button 
                variant="outline" 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
