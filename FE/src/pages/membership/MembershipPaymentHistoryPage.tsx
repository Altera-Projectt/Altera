import { useEffect, useState } from 'react'
import { MembershipService } from '@/services/membership.api'
import { formatVND } from '@/utils/format'
type Item = { _id: string; status: string; paymentReference: string; amount: number; paymentMethod: string; transactionId: string | null; createdAt: string; membershipPlanId: { name: string; code: string } }
export function MembershipPaymentHistoryPage() {
  const [items,setItems]=useState<Item[]>([]);const [error,setError]=useState('')
  useEffect(()=>{MembershipService.history().then(r=>setItems(r.data.data.payments)).catch(()=>setError('Không thể tải lịch sử thanh toán.'))},[])
  return <section className="mx-auto max-w-6xl px-5 py-10"><h1 className="text-3xl font-bold">Lịch sử thanh toán</h1><p className="mt-2 text-gray-600">Các giao dịch Membership của tài khoản này.</p>{error&&<p role="alert" className="mt-4 text-red-700">{error}</p>}<div className="mt-6 overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-gray-50"><tr>{['Ngày','Membership','Số tiền','Phương thức','Mã giao dịch','Trạng thái'].map(x=><th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{items.map(i=><tr className="border-t" key={i._id}><td className="p-3">{new Date(i.createdAt).toLocaleDateString('vi-VN')}</td><td className="p-3">{i.membershipPlanId?.name}</td><td className="p-3">{formatVND(i.amount)}</td><td className="p-3">{i.paymentMethod}</td><td className="p-3">{i.transactionId||i.paymentReference}</td><td className="p-3">{i.status}</td></tr>)}</tbody></table>{!items.length&&!error&&<p className="p-6 text-center text-gray-500">Chưa có giao dịch.</p>}</div></section>
}
