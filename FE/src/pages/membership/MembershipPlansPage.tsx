import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Crown, Sparkles } from 'lucide-react'
import { MembershipService, type MembershipPlan } from '@/services/membership.api'
import { formatVND } from '@/utils/format'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

export function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [membership, setMembership] = useState<{
    membershipPlanId: MembershipPlan | null
    membershipStatus: string
    membershipEndDate: string | null
  } | null>(null)
  const [error, setError] = useState('')
  const authenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    MembershipService.plans()
      .then((r) => setPlans(r.data.data.plans))
      .catch(() => setError('Không thể tải các gói thành viên.'))
    if (authenticated) {
      MembershipService.current()
        .then((r) => setMembership(r.data.data.membership))
        .catch(() => undefined)
    }
  }, [authenticated])

  return (
    <section className="min-h-screen bg-[#060B16] px-5 py-14 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-[#162038] px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-cyan-400">
            <Crown className="h-3.5 w-3.5" />
            ALTERA VIP Membership
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-normal text-slate-100 md:text-5xl">
            Chọn Gói Hội Viên Sáng Tạo
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 md:text-base">
            Mở rộng hạn mức tạo họa tiết AI Thiết kế Áo Thun, Tách nền tự động và đặc quyền thương mại hóa thiết kế trên Marketplace.
          </p>
        </header>

        {membership?.membershipPlanId && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-400/30 bg-[#0F172A] p-5">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <p className="text-sm text-slate-200">
                Gói hiện tại của bạn:{' '}
                <strong className="text-cyan-400">{membership.membershipPlanId.name}</strong> ·{' '}
                <span className="text-slate-400">{membership.membershipStatus}</span>
                {membership.membershipEndDate &&
                  ` · Hết hạn ${new Date(membership.membershipEndDate).toLocaleDateString('vi-VN')}`}
              </p>
            </div>
            <Link
              to="/membership"
              className="text-xs font-bold text-cyan-400 hover:underline"
            >
              Quản lý quyền lợi Hội viên →
            </Link>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
          >
            {error}
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isHighlighted = plan.code === 'PREMIUM' || plan.code === 'PRO_STUDIO'
            return (
              <article
                key={plan._id}
                className={`flex flex-col rounded-2xl border p-7 transition-all ${
                  plan.code === 'PRO_STUDIO'
                    ? 'border-amber-400/40 bg-gradient-to-b from-[#162038] to-[#0F172A] shadow-xl'
                    : isHighlighted
                      ? 'border-cyan-400/40 bg-[#0F172A] shadow-xl shadow-cyan-500/10'
                      : 'border-blue-400/15 bg-[#0F172A]'
                }`}
              >
                <h2 className="text-xl font-bold tracking-normal text-slate-100">{plan.name}</h2>
                <p className="mt-2 min-h-10 text-sm text-slate-400">{plan.description}</p>
                <p className="my-6 text-3xl font-extrabold tracking-normal text-cyan-400">
                  {plan.price ? formatVND(plan.price) : 'Miễn phí'}
                  <span className="ml-1.5 text-xs font-normal text-slate-400">
                    {plan.billingCycle === 'MONTHLY' ? '/ 30 ngày' : ''}
                  </span>
                </p>
                <ul className="mb-7 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="w-full bg-blue-600 hover:bg-blue-500 text-slate-100 font-bold"
                >
                  <Link to={`/membership/checkout?plan=${plan.code}`}>
                    {plan.price ? 'Nâng cấp gói này' : 'Sử dụng miễn phí'}
                  </Link>
                </Button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
