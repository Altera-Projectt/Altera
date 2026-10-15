import { useCallback, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { AdminService } from '@/services/admin.api'
import { formatVND } from '@/utils/format'

type Design = { _id: string; name: string; thumbnail?: string; thumbnailUrl?: string; price: number; category?: string; status: string; rejectionReason?: string; createdAt: string; designerId?: { displayName?: string; username?: string }; userId?: { fullName?: string; email?: string }; moderationHistory?: Array<{ status: string; reason?: string; changedAt: string; moderatorId?: string }> }
type Pagination = { total: number; page: number; limit: number; totalPages: number }
const designStatusLabel: Record<string, string> = { DRAFT: 'Bản nháp', PENDING_REVIEW: 'Chờ duyệt', PUBLISHED: 'Đang đăng bán', REJECTED: 'Bị từ chối', ARCHIVED: 'Đã ẩn' }
const messageOf = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể tải danh sách thiết kế.'

const statusBadgeCls: Record<string, string> = {
  PUBLISHED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  PENDING_REVIEW: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  REJECTED: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  ARCHIVED: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  DRAFT: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
}

export function AdminDesignsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<Design[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const load = useCallback(async (page = 1) => {
    try {
      const response = await AdminService.designs({ page, limit: 20, search: search.trim() || undefined, status: status || undefined })
      setItems(response.data.data.designs as Design[]); setPagination(response.data.data.pagination as Pagination)
    } catch (error: unknown) { setError(messageOf(error)) } finally { setLoading(false) }
  }, [search, status])
  useEffect(() => {
    let active = true
    AdminService.designs({ page: 1, limit: 20, search: search.trim() || undefined, status: status || undefined })
      .then((response) => { if (active) { setItems(response.data.data.designs as Design[]); setPagination(response.data.data.pagination as Pagination) } })
      .catch((error: unknown) => { if (active) setError(messageOf(error)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [search, status])

  const moderate = async (design: Design, nextStatus: 'PUBLISHED' | 'REJECTED' | 'ARCHIVED') => {
    let rejectionReason: string | undefined
    if (nextStatus === 'REJECTED') {
      const value = window.prompt('Nhập lý do từ chối (bắt buộc):')
      if (value === null) return
      rejectionReason = value.trim()
      if (!rejectionReason || rejectionReason.length > 1000) { setError('Lý do từ chối phải có từ 1 đến 1000 ký tự.'); return }
    } else if (!window.confirm(nextStatus === 'PUBLISHED' ? `Duyệt thiết kế “${design.name}”?` : `Ẩn thiết kế “${design.name}” khỏi Marketplace?`)) return
    setBusyId(design._id); setError(''); setNotice('')
    try {
      await AdminService.moderateDesign(design._id, { status: nextStatus, rejectionReason })
      setNotice('Đã cập nhật trạng thái thiết kế.'); await load()
    } catch (error: unknown) { setError(messageOf(error)) } finally { setBusyId('') }
  }

  return <section className="mx-auto max-w-[1500px] space-y-6 text-slate-100">
    <div><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-400">NGƯỜI DÙNG VÀ THIẾT KẾ</p><h1 className="mt-2 text-3xl font-bold normal-case tracking-tight text-white">Quản lý Áo Đang Bán (Marketplace)</h1><p className="mt-2 text-sm text-slate-400">Duyệt và quản lý các thiết kế áo thun do người dùng tạo ra để bán trên sàn.</p></div>
    <div className="flex flex-wrap gap-3 rounded-xl border border-blue-400/15 bg-[#0F172A] p-4 shadow-lg shadow-black/20"><label className="relative min-w-[240px] flex-1"><span className="sr-only">Tìm thiết kế hoặc người tạo</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(event) => { setSearch(event.target.value); setLoading(true) }} placeholder="Tìm thiết kế hoặc người tạo" className="w-full rounded-lg border border-blue-400/20 bg-[#162038] py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none" /></label><select aria-label="Lọc trạng thái thiết kế" value={status} onChange={(event) => { const nextStatus = event.target.value; setStatus(nextStatus); setLoading(true); setPagination((current) => ({ ...current, page: 1 })); const params: Record<string,string> = nextStatus ? { status: nextStatus } : {}; setSearchParams(params, { replace: true }) }} className="rounded-lg border border-blue-400/20 bg-[#162038] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"><option value="" className="bg-[#0F172A] text-white">Tất cả trạng thái</option>{['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'].map((value) => <option key={value} value={value} className="bg-[#0F172A] text-white">{designStatusLabel[value]}</option>)}</select></div>
    {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}{notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}
    <div className="overflow-hidden rounded-xl border border-blue-400/15 bg-[#0F172A] shadow-lg shadow-black/20"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[#162038]/80 text-xs uppercase tracking-wider font-semibold text-slate-300 border-b border-blue-400/15"><tr>{['Thiết kế', 'Người tạo', 'Giá', 'Trạng thái', 'Ngày đăng', 'Thao tác'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-10 text-center text-slate-400">Đang tải thiết kế…</td></tr> : items.map((item) => <tr key={item._id} className="border-t border-blue-400/10 hover:bg-blue-500/[0.05] transition-colors align-top"><td className="px-4 py-4"><div className="flex items-center gap-3"><img src={item.thumbnailUrl || item.thumbnail || ''} alt="" className="h-14 w-14 rounded-lg bg-[#162038] border border-blue-400/20 object-cover"/><div><p className="font-semibold text-white">{item.name}</p><p className="mt-1 text-xs text-slate-400">{item.category || 'Chưa phân loại'} · {formatVND(item.price)}</p></div></div>{item.moderationHistory?.length ? <details className="mt-2 text-xs text-slate-400"><summary className="cursor-pointer">Lịch sử kiểm duyệt ({item.moderationHistory.length})</summary><ul className="mt-2 space-y-1">{item.moderationHistory.slice().reverse().map((entry, index) => <li key={`${entry.changedAt}-${index}`}>{designStatusLabel[entry.status] || entry.status} · {new Date(entry.changedAt).toLocaleString('vi-VN')}{entry.reason ? ` · ${entry.reason}` : ''}</li>)}</ul></details> : null}</td><td className="px-4 py-4"><span className="font-medium text-slate-200">{item.designerId?.displayName || item.userId?.fullName || '—'}</span><p className="text-xs text-slate-400">{item.designerId?.username ? `@${item.designerId.username}` : item.userId?.email || ''}</p></td><td className="px-4 py-4 font-semibold text-cyan-400">{formatVND(item.price)}</td><td className="px-4 py-4"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeCls[item.status] || 'bg-slate-500/15 text-slate-300 border border-slate-500/30'}`}>{designStatusLabel[item.status] || item.status}</span>{item.rejectionReason && <p className="mt-2 max-w-[220px] text-xs text-rose-400">{item.rejectionReason}</p>}</td><td className="px-4 py-4 text-slate-200">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-2">{item.status === 'PENDING_REVIEW' && <><button disabled={busyId === item._id} onClick={() => void moderate(item, 'PUBLISHED')} className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition">Duyệt</button><button disabled={busyId === item._id} onClick={() => void moderate(item, 'REJECTED')} className="rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/15 px-3 py-1.5 text-xs font-semibold disabled:opacity-50 transition">Từ chối</button></>}{item.status === 'PUBLISHED' && <button disabled={busyId === item._id} onClick={() => void moderate(item, 'ARCHIVED')} className="rounded-lg border border-blue-400/20 bg-[#162038]/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-blue-500/20 disabled:opacity-50 transition">Ẩn</button>}</div></td></tr>)}{!loading && !items.length && <tr><td colSpan={6} className="p-12 text-center text-slate-400">Không tìm thấy thiết kế.</td></tr>}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-400/15 px-4 py-3 text-sm text-slate-400"><span>{pagination.total.toLocaleString()} thiết kế</span><div className="flex items-center gap-2"><button disabled={pagination.page <= 1 || loading} onClick={() => { setLoading(true); void load(pagination.page - 1) }} className="rounded-lg border border-blue-400/20 bg-[#162038]/60 text-slate-200 hover:bg-blue-500/20 px-3 py-1.5 disabled:opacity-40 transition">Trước</button><span>Trang {pagination.page} / {Math.max(1, pagination.totalPages)}</span><button disabled={pagination.page >= pagination.totalPages || loading} onClick={() => { setLoading(true); void load(pagination.page + 1) }} className="rounded-lg border border-blue-400/20 bg-[#162038]/60 text-slate-200 hover:bg-blue-500/20 px-3 py-1.5 disabled:opacity-40 transition">Sau</button></div></div></div>
  </section>
}
