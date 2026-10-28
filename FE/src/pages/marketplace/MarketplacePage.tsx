import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flame, Heart, Search, Shirt, SlidersHorizontal, Sparkles } from 'lucide-react'
import { MarketplaceService, type MarketplaceDesign } from '@/services/marketplace.api'
import homepage2 from '@/assets/homepage2.jpg'
import { useAuth } from '@/hooks/useAuth'
import api from '@/utils/axios'
import { toast } from 'sonner'
import { optimizeImage, getLqipImage } from '@/utils/format'
import { ProgressiveImage } from '@/components/ui/ProgressiveImage'

const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} ₫`

const STYLE_CHIPS = [
  { label: 'Tất cả phong cách', value: '' },
  { label: 'Streetwear', value: 'Streetwear' },
  { label: 'Minimalist', value: 'Minimalist' },
  { label: 'Vintage / Retro', value: 'Vintage' },
  { label: 'Y2K / Cyber', value: 'Y2K' },
  { label: 'Văn hóa Việt', value: 'Việt' },
  { label: 'Typo / Art', value: 'Art' },
]

const PRICE_RANGES = [
  { label: 'Mọi mức giá', min: '', max: '' },
  { label: 'Dưới 240.000 ₫', min: '', max: '240000' },
  { label: '240.000 – 280.000 ₫', min: '240000', max: '280000' },
  { label: 'Trên 280.000 ₫', min: '280000', max: '' },
]

export function MarketplacePage() {
  const [designs, setDesigns] = useState<MarketplaceDesign[]>([])
  const [search, setSearch] = useState('')
  const [styleTag, setStyleTag] = useState('')
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [designer, setDesigner] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('Newest')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    const combinedSearch = [search.trim(), styleTag.trim()].filter(Boolean).join(' ')
    const timer = window.setTimeout(() => {
      setLoading(true)
      MarketplaceService.list({
        search: combinedSearch || undefined,
        category: category || undefined,
        color: color.trim() || undefined,
        size: size || undefined,
        designer: designer.trim() || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort,
        page,
        limit: 16,
      })
        .then(({ data }) => {
          if (!active) return
          setDesigns(data.data.designs)
          setPages(Math.max(1, data.data.pagination.totalPages))
          setTotalCount(data.data.pagination.total || data.data.designs.length)
          setError('')
        })
        .catch(() => {
          if (active) setError('Không thể tải Marketplace. Vui lòng thử lại.')
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [search, styleTag, category, color, size, designer, minPrice, maxPrice, sort, page])

  const toggleLike = async (design: MarketplaceDesign) => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: { pathname: '/marketplace' } } })
      return
    }
    try {
      await api.request({
        method: design.isLiked ? 'DELETE' : 'POST',
        url: `/designers/${design._id}/like`,
      })
      setDesigns((items) =>
        items.map((item) =>
          item._id === design._id
            ? {
                ...item,
                isLiked: !item.isLiked,
                likesCount: Math.max(0, item.likesCount + (item.isLiked ? -1 : 1)),
              }
            : item
        )
      )
    } catch {
      toast.error('Không thể cập nhật yêu thích. Vui lòng thử lại.')
    }
  }

  const resetAllFilters = () => {
    setSearch('')
    setStyleTag('')
    setCategory('')
    setColor('')
    setSize('')
    setDesigner('')
    setMinPrice('')
    setMaxPrice('')
    setPage(1)
  }

  return (
    <div className="bg-white text-black">
      <section className="relative flex min-h-[420px] items-end overflow-hidden bg-[#060B16] px-6 pb-12 pt-28 text-slate-100 md:min-h-[460px] md:px-12 md:pb-16">
        <img
          src={homepage2}
          alt="ALTERA creator marketplace"
          className="absolute inset-0 h-full w-full object-cover object-[center_18%] opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060B16]/95 via-[#060B16]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060B16] via-transparent to-black/20" />
        <div className="relative mx-auto w-full max-w-7xl z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-[#0F172A]/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Shirt className="h-3.5 w-3.5" />
            ALTERA · Sàn Áo Thun Thiết Kế Độc Bản
          </div>
          <h1 className="max-w-3xl text-4xl font-black uppercase leading-[1.08] tracking-normal md:text-6xl">
            Khám Phá Bộ Sưu Tập Áo Thun Creator
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-300 md:text-base leading-relaxed">
            Đa dạng phong cách từ Streetwear, Minimalist, Vintage, Y2K đến Bản sắc Việt trên nền vải Cotton 240gsm – 280gsm cao cấp. Giá hoàn thiện chỉ từ <strong className="text-cyan-400">219.000 ₫</strong>.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/design"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-100 transition hover:bg-blue-500 shadow-lg"
            >
              <Sparkles className="h-4 w-4 text-cyan-300" />
              Tự thiết kế &amp; Mở bán áo của bạn
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 backdrop-blur-sm px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-black"
            >
              Xem Kho Phôi Áo Thun Trơn (Từ 139.000 ₫)
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        {/* Quick Style Filter Pills */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {STYLE_CHIPS.map((chip) => {
              const active = styleTag === chip.value
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setPage(1)
                    setStyleTag(chip.value)
                  }}
                  className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                    active
                      ? 'border-black bg-black text-white shadow-sm'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:border-black'
                  }`}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRICE_RANGES.map((range) => {
              const active = minPrice === range.min && maxPrice === range.max
              return (
                <button
                  key={range.label}
                  type="button"
                  onClick={() => {
                    setPage(1)
                    setMinPrice(range.min)
                    setMaxPrice(range.max)
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {range.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-7 flex flex-col gap-4 border-b border-neutral-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-neutral-500">
              Cộng đồng Creator · {totalCount} mẫu thiết kế
            </p>
            <h2 className="mt-2 text-2xl font-bold uppercase tracking-normal">
              Áo Thun Thiết Kế Đang Mở Bán
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Tìm thiết kế</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(event) => {
                  setPage(1)
                  setSearch(event.target.value)
                }}
                placeholder="Tên áo, phong cách, creator..."
                className="w-full rounded-lg border border-neutral-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-black sm:w-64"
              />
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3">
              <SlidersHorizontal className="h-4 w-4 text-neutral-500" />
              <span className="sr-only">Danh mục</span>
              <select
                value={category}
                onChange={(event) => {
                  setPage(1)
                  setCategory(event.target.value)
                }}
                className="bg-transparent py-2.5 text-sm outline-none"
              >
                <option value="">Tất cả dòng sản phẩm</option>
                <option value="T-Shirt">Áo Thun (T-Shirt)</option>
                <option value="Streetwear">Streetwear</option>
                <option value="Minimalist">Minimalist</option>
                <option value="Vintage">Vintage</option>
                <option value="Y2K">Y2K</option>
                <option value="Accessory">Phụ kiện / Túi Tote</option>
              </select>
            </label>
            <label className="sr-only" htmlFor="market-sort">
              Sắp xếp
            </label>
            <select
              id="market-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="Newest">Mới nhất</option>
              <option value="Best Selling">Bán chạy nhất</option>
              <option value="Popular">Được yêu thích nhất</option>
              <option value="Price Low → High">Giá: Thấp đến Cao</option>
              <option value="Price High → Low">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowMobileFilters(true)}
          className="mb-5 flex w-full items-center justify-between border-y border-neutral-200 py-3 text-xs font-semibold uppercase tracking-widest md:hidden"
        >
          Bộ lọc chi tiết <SlidersHorizontal size={16} />
        </button>

        {showMobileFilters && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Bộ lọc Marketplace"
            className="fixed inset-0 z-[70] flex items-end bg-black/40 md:hidden"
            onClick={() => setShowMobileFilters(false)}
          >
            <div
              className="w-full space-y-4 rounded-t-2xl bg-white p-5 pb-8"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-widest">Bộ lọc</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="border px-3 py-1.5 text-xs"
                >
                  Đóng
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs text-neutral-500">
                  Màu sắc
                  <input
                    value={color}
                    onChange={(event) => {
                      setPage(1)
                      setColor(event.target.value)
                    }}
                    className="mt-1 w-full border-b py-2 text-sm text-black"
                  />
                </label>
                <label className="text-xs text-neutral-500">
                  Kích cỡ
                  <select
                    value={size}
                    onChange={(event) => {
                      setPage(1)
                      setSize(event.target.value)
                    }}
                    className="mt-1 w-full border-b bg-white py-2 text-sm text-black"
                  >
                    <option value="">Tất cả kích cỡ</option>
                    {['S', 'M', 'L', 'XL'].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-neutral-500">
                  Giá từ
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(event) => {
                      setPage(1)
                      setMinPrice(event.target.value)
                    }}
                    className="mt-1 w-full border-b py-2 text-sm text-black"
                  />
                </label>
                <label className="text-xs text-neutral-500">
                  Đến giá
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(event) => {
                      setPage(1)
                      setMaxPrice(event.target.value)
                    }}
                    className="mt-1 w-full border-b py-2 text-sm text-black"
                  />
                </label>
                <label className="col-span-2 text-xs text-neutral-500">
                  Nhà thiết kế
                  <input
                    value={designer}
                    onChange={(event) => {
                      setPage(1)
                      setDesigner(event.target.value)
                    }}
                    placeholder="Tên tài khoản hoặc tên hiển thị"
                    className="mt-1 w-full border-b py-2 text-sm text-black"
                  />
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={resetAllFilters}
                  className="flex-1 border px-4 py-3 text-xs font-semibold uppercase"
                >
                  Xóa lọc
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 bg-black px-4 py-3 text-xs font-semibold uppercase text-white"
                >
                  Xem kết quả
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 hidden grid-cols-2 gap-3 border-b border-neutral-200 pb-6 sm:grid-cols-3 md:grid lg:grid-cols-6">
          <label className="text-xs text-neutral-500">
            Màu sắc
            <input
              value={color}
              onChange={(event) => {
                setPage(1)
                setColor(event.target.value)
              }}
              placeholder="Đen, Trắng, Kem..."
              className="mt-1 w-full border-b border-neutral-300 py-2 text-sm text-black outline-none focus:border-black"
            />
          </label>
          <label className="text-xs text-neutral-500">
            Kích cỡ
            <select
              value={size}
              onChange={(event) => {
                setPage(1)
                setSize(event.target.value)
              }}
              className="mt-1 w-full border-b border-neutral-300 bg-white py-2 text-sm text-black"
            >
              <option value="">Tất cả kích cỡ</option>
              {['S', 'M', 'L', 'XL'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500">
            Nhà thiết kế
            <input
              value={designer}
              onChange={(event) => {
                setPage(1)
                setDesigner(event.target.value)
              }}
              placeholder="Tên tài khoản"
              className="mt-1 w-full border-b border-neutral-300 py-2 text-sm text-black outline-none focus:border-black"
            />
          </label>
          <label className="text-xs text-neutral-500">
            Giá từ (₫)
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(event) => {
                setPage(1)
                setMinPrice(event.target.value)
              }}
              className="mt-1 w-full border-b border-neutral-300 py-2 text-sm text-black outline-none focus:border-black"
            />
          </label>
          <label className="text-xs text-neutral-500">
            Đến giá (₫)
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => {
                setPage(1)
                setMaxPrice(event.target.value)
              }}
              className="mt-1 w-full border-b border-neutral-300 py-2 text-sm text-black outline-none focus:border-black"
            />
          </label>
          <button
            onClick={resetAllFilters}
            className="self-end py-2 text-left text-xs font-bold uppercase tracking-widest text-neutral-600 underline hover:text-black"
          >
            Đặt lại bộ lọc
          </button>
        </div>

        {error && (
          <div role="alert" className="py-16 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && !error && (
          <div
            aria-label="Đang tải thiết kế"
            className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4"
          >
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] rounded-2xl bg-neutral-100" />
                <div className="mt-3 h-4 w-3/4 bg-neutral-100" />
                <div className="mt-2 h-3 w-1/2 bg-neutral-100" />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && designs.length === 0 && (
          <div className="border-y border-neutral-200 py-20 text-center">
            <p className="text-lg font-semibold">Chưa có thiết kế phù hợp bộ lọc</p>
            <p className="mt-2 text-sm text-neutral-500">
              Hãy thử chọn lại mức giá hoặc phong cách khác.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-4 rounded-lg bg-black px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white"
            >
              Xem toàn bộ thiết kế
            </button>
          </div>
        )}

        {!loading && !error && designs.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {designs.map((design) => (
              <article
                key={design._id}
                className="group flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-3 transition hover:-translate-y-1 hover:border-black/40 hover:shadow-lg"
              >
                <div>
                  <div className="relative">
                    <Link to={`/design/${design.slug}`} className="block">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100 flex items-center justify-center">
                        <ProgressiveImage
                          src={optimizeImage(
                            design.thumbnail || design.productId?.imageUrl || '',
                            500
                          )}
                          placeholderSrc={getLqipImage(
                            design.thumbnail || design.productId?.imageUrl || ''
                          )}
                          alt={design.name}
                          loading="lazy"
                          className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        <span className="absolute bottom-2.5 left-2.5 z-10 rounded-md bg-black/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                          {design.category || design.productId?.category || 'Áo Thun 3D'}
                        </span>
                        {(design.salesCount ?? 0) > 0 && (
                          <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-black shadow-sm">
                            <Flame className="h-3 w-3" />
                            Đã bán {design.salesCount}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 truncate text-sm font-bold tracking-normal text-neutral-900 group-hover:text-blue-600">
                        {design.name}
                      </h3>
                    </Link>
                    <button
                      onClick={() => void toggleLike(design)}
                      aria-label={design.isLiked ? 'Bỏ thích thiết kế' : 'Thích thiết kế'}
                      className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          design.isLiked ? 'fill-rose-500 text-rose-500' : 'text-neutral-700'
                        }`}
                      />
                    </button>
                  </div>

                  {design.designerId && (
                    <Link
                      to={`/designer/${design.designerId.username}`}
                      className="mt-1 inline-block text-xs text-neutral-500 hover:text-black"
                    >
                      Creator: <strong className="font-medium text-neutral-700">{design.designerId.displayName}</strong>
                    </Link>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5">
                  <span className="text-sm font-extrabold text-neutral-900">
                    {money(design.price)}
                  </span>
                  <Link
                    to={`/design/${design.slug}`}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Chọn size →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && pages > 1 && (
          <nav
            aria-label="Phân trang Marketplace"
            className="mt-12 flex items-center justify-center gap-5 text-sm"
          >
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-40"
            >
              Trước
            </button>
            <span className="font-semibold">
              Trang {page} / {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-40"
            >
              Tiếp
            </button>
          </nav>
        )}
      </section>
    </div>
  )
}
