import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/fashion'
import { ProductService } from '@/services/product.api'
import type { Product } from '@/types/product.types'
import { Button } from '@/components/ui/Button'
import { GridLoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/utils/cn'
import { ChevronDown, Search } from 'lucide-react'
import homepage2 from '@/assets/homepage2.jpg'

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
  
  const [showFilters, setShowFilters] = useState(false)

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
    <div className="min-h-screen bg-white text-black font-body pt-[70px]">

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="relative w-full h-[400px] md:h-[500px] bg-black overflow-hidden">
        <img src={homepage2} alt="Studio Banner" className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
        
        <div className="absolute bottom-12 left-6 md:left-12 max-w-4xl z-10">
          <h1 className="font-heading text-[clamp(2.5rem,6vw,5rem)] font-black uppercase text-white leading-[1.05] tracking-tight">
            KHÁM PHÁ NHỮNG MẪU <br /> THIẾT KẾ ĐỘC ĐÁO
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 md:py-20">
        {/* ── Filter & Search Strip ──────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-black/20 pb-4">
          
          {/* Left: Filter Button */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 font-heading font-black text-sm md:text-base uppercase tracking-widest hover:text-[#0011FF] transition-colors w-full md:w-auto justify-between md:justify-start"
          >
            FILTER <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
          </button>

          {/* Middle: Search Input */}
          <div className="w-full md:w-[450px] relative order-last md:order-none mt-4 md:mt-0">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên thiết kế..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full bg-transparent border-b border-black/20 pb-2 pl-8 text-sm md:text-base font-medium outline-none focus:border-black transition-colors uppercase placeholder:normal-case placeholder:font-normal placeholder:text-gray-400 text-black"
            />
          </div>
          
          {/* Right: Empty for balance */}
          <div className="hidden md:block w-[100px]"></div>
        </div>

        {/* ── Expanded Filters Panel ─────────────────────────────────────────── */}
        {showFilters && (
          <div className="mb-12 p-6 md:p-8 bg-[#F8F8F8] space-y-6 md:space-y-8 shadow-inner">
            {/* Categories */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <span className="text-xs font-bold uppercase tracking-widest md:w-24 text-gray-500">Category</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setCategory(category === cat ? '' : cat); setPage(1) }}
                    className={cn(
                      'px-5 py-2 text-[11px] font-bold uppercase tracking-widest border transition-all duration-200',
                      category === cat
                        ? 'bg-black text-white border-black'
                        : 'border-black/20 text-black hover:border-black bg-white',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Styles */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <span className="text-xs font-bold uppercase tracking-widest md:w-24 text-gray-500">Style</span>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => { setStyle(style === s ? '' : s); setPage(1) }}
                    className={cn(
                      'px-5 py-2 text-[11px] font-bold uppercase tracking-widest border transition-all duration-200',
                      style === s
                        ? 'bg-black text-white border-black'
                        : 'border-black/20 text-black hover:border-black bg-white',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Genders + clear */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <span className="text-xs font-bold uppercase tracking-widest md:w-24 text-gray-500">Gender</span>
              <div className="flex flex-wrap items-center gap-2 w-full">
                {GENDERS.map(g => (
                  <button
                    key={g}
                    onClick={() => { setGender(gender === g ? '' : g); setPage(1) }}
                    className={cn(
                      'px-5 py-2 text-[11px] font-bold uppercase tracking-widest border transition-all duration-200',
                      gender === g
                        ? 'bg-black text-white border-black'
                        : 'border-black/20 text-black hover:border-black bg-white',
                    )}
                  >
                    {g}
                  </button>
                ))}

                {(category || style || gender || search) && (
                  <button
                    onClick={handleClearFilters}
                    className="md:ml-auto mt-4 md:mt-0 text-[11px] uppercase tracking-widest font-black underline underline-offset-4 hover:text-[#0011FF]"
                  >
                    CLEAR ALL
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Main Grid ─────────────────────────────────────────────── */}
        <div className="w-full min-h-[50vh]">
          {loading ? (
            <GridLoadingState cols={4} className="gap-x-6 gap-y-12" />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 border border-red-500/20 bg-red-500/5">
              <p className="text-sm font-medium text-red-500">{error}</p>
              <Button onClick={() => fetchProducts()} size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                Retry
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 border border-dashed border-black/20 bg-gray-50/50">
              <Search className="w-10 h-10 text-black/20" />
              <p className="text-sm text-black/50 font-bold uppercase tracking-widest">
                KHÔNG TÌM THẤY THIẾT KẾ NÀO.
              </p>
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="border-black text-black hover:bg-black hover:text-white font-bold tracking-widest uppercase">
                XÓA BỘ LỌC
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 md:gap-y-16 lg:grid-cols-4">
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-24">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-black text-black hover:bg-black hover:text-white font-bold tracking-widest uppercase text-[10px]"
                  >
                    PREV
                  </Button>
                  <span className="text-sm font-bold px-4">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-black text-black hover:bg-black hover:text-white font-bold tracking-widest uppercase text-[10px]"
                  >
                    NEXT
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
