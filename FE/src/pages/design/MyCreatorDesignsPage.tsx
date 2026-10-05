import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ExternalLink, Palette } from 'lucide-react'
import api from '@/utils/axios'
import { DesignService, type CustomDesignDraft } from '@/services/design.api'

type Listing = { _id: string; slug: string; name: string; thumbnail: string; price: number; status: string; salesCount: number; rejectionReason?: string; collectionId?: string | null }
type Collection = { _id: string; name: string }
type Tab = 'ALL' | 'DRAFT' | 'PUBLISHED' | 'COLLECTIONS' | 'SOLD' | 'ARCHIVED'
const tabs: Tab[] = ['ALL', 'DRAFT', 'PUBLISHED', 'COLLECTIONS', 'SOLD', 'ARCHIVED']

export function MyCreatorDesignsPage() {
  const [drafts, setDrafts] = useState<CustomDesignDraft[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [tab, setTab] = useState<Tab>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [draftResponse, profileResponse] = await Promise.all([
          DesignService.listCustomDrafts(),
          DesignService.getMyDesignerProfile(),
        ])
        const username = profileResponse.data.data.profile.username
        const statuses = ['PUBLISHED', 'DRAFT', 'PENDING_REVIEW', 'REJECTED', 'ARCHIVED']
        const listingResponses = await Promise.all(statuses.map((status) => api.get<{ data: { designs: Listing[], collections: Collection[] } }>(`/designers/${username}`, { params: { status, limit: 40 } })))
        if (!active) return
        setDrafts(draftResponse.data.data.drafts)
        setListings([...new Map(listingResponses.flatMap((response) => response.data.data.designs).map((listing) => [listing._id, listing])).values()])
        if (listingResponses.length > 0) setCollections(listingResponses[0].data.data.collections || [])
      } catch { if (active) setError('Không thể tải thiết kế. Vui lòng thử lại.') }
      finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [])

  const visibleDrafts = tab === 'ALL' || tab === 'DRAFT' ? drafts : []
  const visibleListings = useMemo(() => listings.filter((listing) => {
    if (tab === 'ALL' || tab === 'COLLECTIONS') return true
    if (tab === 'SOLD') return listing.salesCount > 0
    return listing.status === tab
  }), [listings, tab])

  return <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-10 md:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-6"><div><p className="text-xs uppercase tracking-[.2em] text-neutral-500">Creator studio</p><h1 className="mt-2 text-3xl font-black uppercase md:text-4xl">My designs</h1><p className="mt-2 text-sm text-neutral-500">Bản nháp custom, listing đã duyệt và thiết kế đã bán.</p></div><Link to="/design" className="inline-flex items-center gap-2 bg-black px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white"><Palette size={15}/> Start designing</Link></div>
    <nav aria-label="Design status" className="mt-7 flex gap-6 overflow-x-auto border-b border-neutral-200">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 border-b-2 px-1 pb-3 text-xs font-semibold tracking-widest ${tab === item ? 'border-black text-black' : 'border-transparent text-neutral-500'}`}>{item}</button>)}</nav>
    {error && <p role="alert" className="py-12 text-center text-sm text-red-700">{error}</p>}
    {loading && <div aria-label="Loading designs" className="grid grid-cols-2 gap-4 py-8 md:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="animate-pulse"><div className="aspect-[4/5] bg-neutral-100"/><div className="mt-3 h-4 w-3/4 bg-neutral-100"/></div>)}</div>}
    {!loading && !error && !visibleDrafts.length && !visibleListings.length && <div className="py-20 text-center"><p className="text-lg font-semibold">Chưa có thiết kế trong mục này</p><p className="mt-2 text-sm text-neutral-500">Tạo thiết kế mới hoặc mở các bản nháp trong Design Studio.</p><Link to="/design" className="mt-5 inline-block border border-black px-5 py-3 text-xs font-semibold uppercase tracking-widest">Mở Design Studio</Link></div>}
    
    {!loading && !error && tab === 'COLLECTIONS' && (
      <div className="py-7 space-y-12">
        {collections.map((collection) => {
          const collectionListings = listings.filter(l => l.collectionId === collection._id)
          if (collectionListings.length === 0) return null
          return (
            <section key={collection._id}>
              <h2 className="mb-4 text-lg font-bold uppercase tracking-widest">{collection.name}</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                {collectionListings.map((listing) => <article key={listing._id}><Link to={`/design/${listing.slug}`} className="group block"><div className="relative aspect-[4/5] overflow-hidden bg-neutral-100"><img src={listing.thumbnail} alt={listing.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"/><span className="absolute left-2 top-2 bg-white px-2 py-1 text-[10px] uppercase tracking-wider">{listing.status.replace('_', ' ')}</span></div><h2 className="mt-3 truncate text-sm font-semibold uppercase">{listing.name}</h2></Link><div className="mt-1 flex items-center justify-between gap-2 text-xs text-neutral-500"><span>{listing.price.toLocaleString('vi-VN')} ₫ · {listing.salesCount} sold</span><Link to={`/designer/dashboard`} aria-label="Manage creator listing"><ExternalLink size={14}/></Link></div>{listing.rejectionReason && <p className="mt-1 line-clamp-2 text-xs text-red-700">{listing.rejectionReason}</p>}</article>)}
              </div>
            </section>
          )
        })}
        {listings.filter(l => !l.collectionId).length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-bold uppercase tracking-widest">Thiết kế lẻ (Không thuộc BST)</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
              {listings.filter(l => !l.collectionId).map((listing) => <article key={listing._id}><Link to={`/design/${listing.slug}`} className="group block"><div className="relative aspect-[4/5] overflow-hidden bg-neutral-100"><img src={listing.thumbnail} alt={listing.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"/><span className="absolute left-2 top-2 bg-white px-2 py-1 text-[10px] uppercase tracking-wider">{listing.status.replace('_', ' ')}</span></div><h2 className="mt-3 truncate text-sm font-semibold uppercase">{listing.name}</h2></Link><div className="mt-1 flex items-center justify-between gap-2 text-xs text-neutral-500"><span>{listing.price.toLocaleString('vi-VN')} ₫ · {listing.salesCount} sold</span><Link to={`/designer/dashboard`} aria-label="Manage creator listing"><ExternalLink size={14}/></Link></div>{listing.rejectionReason && <p className="mt-1 line-clamp-2 text-xs text-red-700">{listing.rejectionReason}</p>}</article>)}
            </div>
          </section>
        )}
      </div>
    )}

    {!loading && !error && tab !== 'COLLECTIONS' && <div className="grid grid-cols-2 gap-x-4 gap-y-8 py-7 md:grid-cols-3 lg:grid-cols-4">
      {visibleDrafts.map((draft) => <article key={`draft-${draft._id}`}><button onClick={() => navigate(`/design?draft=${encodeURIComponent(draft._id)}`)} className="group block w-full text-left"><div className="aspect-[4/5] overflow-hidden bg-neutral-100">{draft.thumbnail && <img src={draft.thumbnail} alt={draft.name} loading="lazy" className="h-full w-full object-contain transition-transform group-hover:scale-[1.02]"/>}</div><h2 className="mt-3 truncate text-sm font-semibold uppercase">{draft.name}</h2></button><p className="mt-1 text-xs text-neutral-500">DRAFT · Updated {new Date(draft.updatedAt).toLocaleDateString('vi-VN')}</p></article>)}
      {visibleListings.map((listing) => <article key={listing._id}><Link to={`/design/${listing.slug}`} className="group block"><div className="relative aspect-[4/5] overflow-hidden bg-neutral-100"><img src={listing.thumbnail} alt={listing.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"/><span className="absolute left-2 top-2 bg-white px-2 py-1 text-[10px] uppercase tracking-wider">{listing.status.replace('_', ' ')}</span></div><h2 className="mt-3 truncate text-sm font-semibold uppercase">{listing.name}</h2></Link><div className="mt-1 flex items-center justify-between gap-2 text-xs text-neutral-500"><span>{listing.price.toLocaleString('vi-VN')} ₫ · {listing.salesCount} sold</span><Link to={`/designer/dashboard`} aria-label="Manage creator listing"><ExternalLink size={14}/></Link></div>{listing.rejectionReason && <p className="mt-1 line-clamp-2 text-xs text-red-700">{listing.rejectionReason}</p>}</article>)}
    </div>}
  </main>
}
