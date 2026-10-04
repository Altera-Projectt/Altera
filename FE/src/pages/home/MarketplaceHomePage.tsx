import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import homepage2 from '@/assets/homepage2.jpg'
import { MarketplaceService, type FeaturedDesigner, type MarketplaceDesign } from '@/services/marketplace.api'

function DesignShelf({ title, eyebrow, items, loading }: { title: string; eyebrow: string; items: MarketplaceDesign[]; loading: boolean }) {
  return <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
    <div className="mb-7 flex items-end justify-between gap-4 border-b border-neutral-200 pb-4"><div><p className="text-[10px] uppercase tracking-[.22em] text-neutral-500">{eyebrow}</p><h2 className="mt-2 text-2xl font-bold uppercase tracking-tight md:text-3xl">{title}</h2></div><Link to="/marketplace" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest">View all <ArrowRight size={15}/></Link></div>
    {loading ? <div aria-label="Đang tải thiết kế" className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="animate-pulse"><div className="aspect-[4/5] bg-neutral-100"/><div className="mt-3 h-4 w-3/4 bg-neutral-100"/><div className="mt-2 h-3 w-1/2 bg-neutral-100"/></div>)}</div> : items.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-4 md:gap-x-6">{items.map((item) => <article key={item._id}><Link to={`/design/${item.slug}`} className="group block"><div className="aspect-[4/5] overflow-hidden bg-neutral-100"><img src={item.thumbnail} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"/></div><h3 className="mt-3 truncate text-sm font-semibold uppercase tracking-wide">{item.name}</h3></Link><div className="mt-1 flex justify-between gap-2 text-xs"><span>{item.price.toLocaleString('vi-VN')} ₫</span><Link to={`/designer/${item.designerId.username}`} className="truncate text-neutral-500 hover:text-black">{item.designerId.displayName}</Link></div></article>)}</div> : <div className="border-y border-neutral-200 py-12 text-center text-sm text-neutral-500">Chưa có thiết kế được duyệt. <Link to="/design" className="font-semibold text-black underline">Tạo thiết kế đầu tiên</Link></div>}
  </section>
}

export function MarketplaceHomePage() {
  const [bestSellers, setBestSellers] = useState<MarketplaceDesign[]>([])
  const [newDesigns, setNewDesigns] = useState<MarketplaceDesign[]>([])
  const [designers, setDesigners] = useState<FeaturedDesigner[]>([])
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.allSettled([
      MarketplaceService.list({ sort: 'Best Selling', limit: 4 }),
      MarketplaceService.list({ sort: 'Newest', limit: 4 }),
      MarketplaceService.featuredDesigners(4),
    ]).then(([best, newest, creators]) => {
      if (!active) return
      if (best.status === 'fulfilled') setBestSellers(best.value.data.data.designs)
      if (newest.status === 'fulfilled') setNewDesigns(newest.value.data.data.designs)
      if (creators.status === 'fulfilled') setDesigners(creators.value.data.data.designers)
      setLoadError([best, newest, creators].every((result) => result.status === 'rejected'))
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  return <main className="bg-white text-black">
    <section className="relative flex min-h-[76dvh] items-end overflow-hidden bg-neutral-950 px-5 pb-12 pt-28 text-white md:min-h-[82dvh] md:px-12 md:pb-20">
      <img src={homepage2} alt="ALTERA custom fashion" className="absolute inset-0 h-full w-full object-cover opacity-65"/><div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent"/>
      <div className="relative mx-auto w-full max-w-7xl"><p className="mb-5 text-xs font-semibold uppercase tracking-[.24em]">ALTERA · Wear your own idea</p><h1 className="max-w-4xl text-5xl font-black uppercase leading-[.94] tracking-tight md:text-8xl">Khám phá thiết kế độc đáo</h1><p className="mt-5 max-w-xl text-sm text-white/80 md:text-base">Chọn thiết kế từ cộng đồng hoặc tự tạo chiếc áo mang dấu ấn của bạn.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/marketplace" className="bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-neutral-200">Khám phá ngay</Link><Link to="/design" className="border border-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-black">Thiết kế áo</Link></div></div>
    </section>
    {loadError && <p role="status" className="mx-auto max-w-7xl px-5 pt-8 text-sm text-neutral-500">Marketplace hiện chưa tải được dữ liệu. Bạn vẫn có thể <Link className="underline" to="/marketplace">mở Design Market</Link>.</p>}
    <DesignShelf title="Bán chạy" eyebrow="Community favorites" items={bestSellers} loading={loading}/>
    <DesignShelf title="Thiết kế mới" eyebrow="Just published" items={newDesigns} loading={loading}/>
    <section className="bg-neutral-950 px-5 py-16 text-white md:py-24"><div className="mx-auto max-w-7xl"><div className="mb-8 flex items-end justify-between border-b border-white/20 pb-4"><div><p className="text-[10px] uppercase tracking-[.22em] text-white/60">Independent creators</p><h2 className="mt-2 text-2xl font-bold uppercase tracking-tight md:text-3xl">Nhà thiết kế nổi bật</h2></div><Link to="/marketplace" className="text-xs font-semibold uppercase tracking-widest underline">Khám phá creator</Link></div>
      {loading ? <p className="py-8 text-sm text-white/60">Đang tải creator…</p> : designers.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{designers.map((designer) => <Link key={designer._id} to={`/designer/${designer.username}`} className="border border-white/20 p-5 transition hover:border-white"><img src={designer.avatar || '/favicon.svg'} alt="" loading="lazy" className="h-14 w-14 rounded-full bg-white object-cover"/><h3 className="mt-4 font-semibold uppercase">{designer.displayName}</h3><p className="mt-1 text-xs text-white/60">{designer.publishedDesigns} designs · {designer.salesCount} sales</p></Link>)}</div> : <p className="py-8 text-sm text-white/60">{loadError ? 'Dữ liệu creator chưa tải được.' : 'Creator profiles sẽ xuất hiện tại đây khi có thiết kế được duyệt.'}</p>}
    </div></section>
    <section className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-16 md:flex-row md:items-center md:justify-between md:px-8 md:py-20"><div><p className="text-xs uppercase tracking-[.22em] text-neutral-500">Design · Publish · Sell</p><h2 className="mt-2 text-3xl font-black uppercase md:text-5xl">Ý tưởng của bạn, chiếc áo của bạn.</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600">Tự thiết kế áo, lưu bản nháp và đăng bán trên marketplace ALTERA.</p></div><Link to="/design" className="shrink-0 bg-black px-6 py-4 text-xs font-bold uppercase tracking-widest text-white">Start designing <ArrowRight className="ml-2 inline" size={15}/></Link></section>
  </main>
}
