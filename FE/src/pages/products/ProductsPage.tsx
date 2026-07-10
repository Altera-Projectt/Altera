import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/fashion'
import { ProductService } from '@/services/product.api'
import type { Product } from '@/types/product.types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'
import { Filter } from 'lucide-react'

const CATEGORIES = ['T-Shirt', 'Hoodie', 'Pants', 'Accessory', 'Shoes']
const STYLES = ['Oversize', 'Boxy', 'Baby Tee', 'Regular', 'Crop', 'Slim']
const GENDERS = ['Men', 'Women', 'Unisex']

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters state
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [style, setStyle] = useState<string>('')
  
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await ProductService.getProducts({
        search: search || undefined,
        category: category || undefined,
        gender: gender || undefined,
        style: style || undefined,
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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts()
    }, 400)
    return () => clearTimeout(timer)
  }, [search, category, gender, style, page])

  const handleClearFilters = () => {
    setCategory('')
    setGender('')
    setStyle('')
    setSearch('')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide">Catalog</h1>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input 
            placeholder="Search products..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1) }} 
            className="w-full md:w-64 h-10 rounded-none border-[var(--color-border)]"
          />
        </div>
      </div>

      {/* Horizontal Filter Bar */}
      <div className="mb-8 space-y-4 border-b border-[var(--color-border)] pb-6">
        
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-none">
          <span className="flex-shrink-0 text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] py-1.5 mr-2">Category:</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(category === cat ? '' : cat); setPage(1) }}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 text-xs font-bold uppercase tracking-wider',
                'border transition-all duration-200',
                category === cat
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-foreground)] bg-transparent text-[var(--color-foreground)]'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Styles */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-none">
          <span className="flex-shrink-0 text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] py-1.5 mr-2">Style:</span>
          {STYLES.map(s => (
            <button
              key={s}
              onClick={() => { setStyle(style === s ? '' : s); setPage(1) }}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 text-xs font-bold uppercase tracking-wider',
                'border transition-all duration-200',
                style === s
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-foreground)] bg-transparent text-[var(--color-foreground)]'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Genders */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-none">
          <span className="flex-shrink-0 text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] py-1.5 mr-2">Gender:</span>
          {GENDERS.map(g => (
            <button
              key={g}
              onClick={() => { setGender(gender === g ? '' : g); setPage(1) }}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 text-xs font-bold uppercase tracking-wider',
                'border transition-all duration-200',
                gender === g
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-foreground)] bg-transparent text-[var(--color-foreground)]'
              )}
            >
              {g}
            </button>
          ))}
          
          {(category || style || gender || search) && (
             <button 
               onClick={handleClearFilters}
               className="ml-auto text-xs underline underline-offset-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
             >
               Clear Filters
             </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="w-full min-h-[50vh]">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-4">
                <div className="aspect-[3/4] w-full animate-pulse bg-[var(--color-muted)]" />
                <div className="h-4 w-2/3 animate-pulse bg-[var(--color-muted)]" />
                <div className="h-4 w-1/3 animate-pulse bg-[var(--color-muted)]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-[var(--color-error)] border border-[var(--color-error)]/20 bg-[var(--color-error)]/5">
            <p>{error}</p>
            <Button onClick={() => fetchProducts()} className="mt-4 rounded-none">Retry</Button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-muted-foreground)] border border-dashed border-[var(--color-border)]">
            <Filter className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p>No products match your filters.</p>
            <Button variant="outline" className="mt-4 rounded-none" onClick={handleClearFilters}>Clear Filters</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <Button 
                  variant="outline" 
                  disabled={page === 1}
                  className="rounded-none uppercase font-bold text-xs"
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
                  className="rounded-none uppercase font-bold text-xs"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
