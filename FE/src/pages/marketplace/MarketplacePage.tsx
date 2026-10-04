import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Search, SlidersHorizontal } from 'lucide-react'
import { MarketplaceService, type MarketplaceDesign } from '@/services/marketplace.api'
import homepage2 from '@/assets/homepage2.jpg'
import { useAuth } from '@/hooks/useAuth'
import api from '@/utils/axios'
import { toast } from 'sonner'

const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} ₫`

export function MarketplacePage() {
  const [designs, setDesigns] = useState<MarketplaceDesign[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [designer, setDesigner] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('Newest')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      MarketplaceService.list({ search: search.trim() || undefined, category: category || undefined, color: color.trim() || undefined, size: size || undefined, designer: designer.trim() || undefined, minPrice: minPrice ? Number(minPrice) : undefined, maxPrice: maxPrice ? Number(maxPrice) : undefined, sort, page, limit: 16 })
        .then(({ data }) => {
          if (!active) return
          setDesigns(data.data.designs)
          setPages(Math.max(1, data.data.pagination.totalPages))
          setError('')
        })
        .catch(() => { if (active) setError('Không thể tải marketplace. Vui lòng thử lại.') })
        .finally(() => { if (active) setLoading(false) })
    }, 250)
    return () => { active = false; window.clearTimeout(timer) }
  }, [search, category, color, size, designer, minPrice, maxPrice, sort, page])

  const toggleLike = async (design: MarketplaceDesign) => {
    if (!isAuthenticated) { navigate('/auth/login', { state: { from: { pathname: '/marketplace' } } }); return }
    try {
      await api.request({ method: design.isLiked ? 'DELETE' : 'POST', url: `/designers/${design._id}/like` })
      setDesigns((items) => items.map((item) => item._id === design._id ? { ...item, isLiked: !item.isLiked, likesCount: Math.max(0, item.likesCount + (item.isLiked ? -1 : 1)) } : item))
    } catch { toast.error('Không thể cập nhật yêu thích. Vui lòng thử lại.') }
  }

  return <div className="bg-white text-black">
    <section className="relative flex min-h-[390px] items-end overflow-hidden bg-neutral-900 px-6 pb-12 pt-24 text-white md:min-h-[500px] md:px-12 md:pb-16">
      <img src={homepage2} alt="ALTERA creator marketplace" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />
      <div className="relative mx-auto w-full max-w-7xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[.24em]">ALTERA · Design Market</p>
        <h1 className="max-w-3xl text-4xl font-black uppercase leading-[.98] tracking-tight md:text-7xl">Khám phá thiết kế độc đáo</h1>
        <p className="mt-5 max-w-xl text-sm text-white/80 md:text-base">Những chiếc áo được tạo bởi cộng đồng sáng tạo ALTERA.</p>
        <Link to="/design" className="mt-7 inline-flex border border-white px-5 py-3 text-xs font-semibold uppercase tracking-widest transition hover:bg-white hover:text-black">Thiết kế áo của bạn</Link>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-7 flex flex-col gap-4 border-b border-neutral-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs uppercase tracking-[.2em] text-neutral-500">Cộng đồng creator</p><h2 className="mt-2 text-2xl font-bold uppercase tracking-tight">Thiết kế mới nhất</h2></div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative"><span className="sr-only">Tìm thiết kế</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"/><input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder="Tên thiết kế, creator, tag" className="w-full border border-neutral-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-black sm:w-64"/></label>
          <label className="flex items-center gap-2 border border-neutral-300 px-3"><SlidersHorizontal className="h-4 w-4 text-neutral-500"/><span className="sr-only">Danh mục</span><select value={category} onChange={(event) => { setPage(1); setCategory(event.target.value) }} className="bg-transparent py-2.5 text-sm outline-none"><option value="">Tất cả danh mục</option><option>T-Shirt</option><option>Hoodie</option><option>Accessory</option></select></label>
          <label className="sr-only" htmlFor="market-sort">Sort</label><select id="market-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="border border-neutral-300 bg-white px-3 py-2.5 text-sm"><option>Newest</option><option>Popular</option><option>Best Selling</option><option>Price Low → High</option><option>Price High → Low</option></select>
        </div>
      </div>

      <button onClick={() => setShowMobileFilters(true)} className="mb-5 flex w-full items-center justify-between border-y border-neutral-200 py-3 text-xs font-semibold uppercase tracking-widest md:hidden">Filters <SlidersHorizontal size={16}/></button>
      {showMobileFilters && <div role="dialog" aria-modal="true" aria-label="Marketplace filters" className="fixed inset-0 z-[70] flex items-end bg-black/40 md:hidden" onClick={() => setShowMobileFilters(false)}><div className="w-full space-y-4 rounded-t-2xl bg-white p-5 pb-8" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><h2 className="text-sm font-semibold uppercase tracking-widest">Filters</h2><button onClick={() => setShowMobileFilters(false)} className="border px-3 py-1.5 text-xs">Close</button></div><label className="block text-xs text-neutral-500">Category<select value={category} onChange={(event) => { setPage(1); setCategory(event.target.value) }} className="mt-1 w-full border-b py-2 text-sm text-black"><option value="">All categories</option><option>T-Shirt</option><option>Hoodie</option><option>Pants</option><option>Shorts</option><option>Jacket</option><option>Accessory</option><option>Shoes</option></select></label><div className="grid grid-cols-2 gap-4"><label className="text-xs text-neutral-500">Color<input value={color} onChange={(event) => { setPage(1); setColor(event.target.value) }} className="mt-1 w-full border-b py-2 text-sm text-black"/></label><label className="text-xs text-neutral-500">Size<select value={size} onChange={(event) => { setPage(1); setSize(event.target.value) }} className="mt-1 w-full border-b bg-white py-2 text-sm text-black"><option value="">All sizes</option>{['S','M','L','XL','XXL'].map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs text-neutral-500">Min price<input type="number" min="0" value={minPrice} onChange={(event) => { setPage(1); setMinPrice(event.target.value) }} className="mt-1 w-full border-b py-2 text-sm text-black"/></label><label className="text-xs text-neutral-500">Max price<input type="number" min="0" value={maxPrice} onChange={(event) => { setPage(1); setMaxPrice(event.target.value) }} className="mt-1 w-full border-b py-2 text-sm text-black"/></label><label className="col-span-2 text-xs text-neutral-500">Designer<input value={designer} onChange={(event) => { setPage(1); setDesigner(event.target.value) }} placeholder="Username or display name" className="mt-1 w-full border-b py-2 text-sm text-black"/></label></div><div className="flex gap-3"><button onClick={() => { setCategory(''); setColor(''); setSize(''); setDesigner(''); setMinPrice(''); setMaxPrice(''); setPage(1) }} className="flex-1 border px-4 py-3 text-xs font-semibold uppercase">Clear</button><button onClick={() => setShowMobileFilters(false)} className="flex-1 bg-black px-4 py-3 text-xs font-semibold uppercase text-white">Show results</button></div></div></div>}
      <div className="mb-8 hidden grid-cols-2 gap-3 border-b border-neutral-200 pb-6 sm:grid-cols-3 md:grid lg:grid-cols-6">
        <label className="text-xs text-neutral-500">Color<input value={color} onChange={(event) => { setPage(1); setColor(event.target.value) }} placeholder="Black" className="mt-1 w-full border-b border-neutral-300 py-2 text-sm text-black outline-none focus:border-black"/></label>
        <label className="text-xs text-neutral-500">Size<select value={size} onChange={(event) => { setPage(1); setSize(event.target.value) }} className="mt-1 w-full border-b border-neutral-300 bg-white py-2 text-sm text-black"><option value="">All sizes</option>{['S','M','L','XL','XXL'].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-xs text-neutral-500">Designer<input value={designer} onChange={(event) => { setPage(1); setDesigner(event.target.value) }} placeholder="username" className="mt-1 w-full border-b border-neutral-300 py-2 text-sm text-black outline-none focus:border-black"/></label>
        <label className="text-xs text-neutral-500">Min price<input type="number" min="0" value={minPrice} onChange={(event) => { setPage(1); setMinPrice(event.target.value) }} className="mt-1 w-full border-b border-neutral-300 py-2 text-sm text-black outline-none focus:border-black"/></label>
        <label className="text-xs text-neutral-500">Max price<input type="number" min="0" value={maxPrice} onChange={(event) => { setPage(1); setMaxPrice(event.target.value) }} className="mt-1 w-full border-b border-neutral-300 py-2 text-sm text-black outline-none focus:border-black"/></label>
        <button onClick={() => { setSearch(''); setCategory(''); setColor(''); setSize(''); setDesigner(''); setMinPrice(''); setMaxPrice(''); setPage(1) }} className="self-end py-2 text-left text-xs uppercase tracking-widest underline">Clear filters</button>
      </div>
      {error && <div role="alert" className="py-16 text-center text-sm text-red-700">{error}</div>}
      {loading && !error && <div aria-label="Đang tải thiết kế" className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="animate-pulse"><div className="aspect-[4/5] bg-neutral-100"/><div className="mt-3 h-4 w-3/4 bg-neutral-100"/><div className="mt-2 h-3 w-1/2 bg-neutral-100"/></div>)}</div>}
      {!loading && !error && designs.length === 0 && <div className="border-y border-neutral-200 py-20 text-center"><p className="text-lg font-semibold">Chưa có thiết kế phù hợp</p><p className="mt-2 text-sm text-neutral-500">Hãy thử từ khóa khác hoặc quay lại sau.</p></div>}
      {!loading && !error && designs.length > 0 && <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">{designs.map((design) => <article key={design._id}>
        <div className="group relative"><Link to={`/design/${design.slug}`} className="block"><div className="relative aspect-[4/5] overflow-hidden bg-neutral-100"><img src={design.thumbnail} alt={design.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"/><span className="absolute bottom-3 left-3 bg-white/95 px-2 py-1 text-[10px] uppercase tracking-widest">{design.category || design.productId?.category || 'Custom'}</span></div><h3 className="mt-3 truncate text-sm font-semibold uppercase tracking-wide">{design.name}</h3></Link><button onClick={() => void toggleLike(design)} aria-label={design.isLiked ? 'Unlike design' : 'Like design'} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95"><Heart className={`h-4 w-4 ${design.isLiked ? 'fill-black' : ''}`}/></button></div>
        <p className="mt-1 text-sm">{money(design.price)}</p><Link to={`/designer/${design.designerId.username}`} className="mt-1 inline-block text-xs text-neutral-500 hover:text-black">Designed by {design.designerId.displayName}</Link>
      </article>)}</div>}
      {!loading && pages > 1 && <nav aria-label="Marketplace pages" className="mt-12 flex items-center justify-center gap-5 text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="border px-4 py-2 disabled:opacity-40">Trước</button><span>{page} / {pages}</span><button disabled={page >= pages} onClick={() => setPage(page + 1)} className="border px-4 py-2 disabled:opacity-40">Tiếp</button></nav>}
    </section>
  </div>
}
