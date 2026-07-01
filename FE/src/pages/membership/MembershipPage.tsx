import { Crown, Sparkles, Zap, Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

// ── Plans Data ─────────────────────────────────────────────────────────────

const plans = [
  {
    id: 'free',
    name: 'FREE',
    price: '0đ',
    period: '/tháng',
    description: 'Dành cho người mới bắt đầu khám phá thời trang AI',
    icon: Sparkles,
    iconBg: '#f5f5f5',
    iconColor: '#737373',
    badgeText: null,
    features: [
      'Quiz phong cách 1 lần/tháng',
      'Lưu tối đa 3 thiết kế',
      'Công cụ thiết kế cơ bản',
      'Gợi ý outfit 5 lần/tháng',
      'Truy cập cộng đồng',
    ],
    cta: 'Bắt đầu miễn phí',
    variant: 'outline' as const,
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    price: '199.000đ',
    period: '/tháng',
    description: 'Lý tưởng cho người yêu thời trang và muốn cá nhân hóa phong cách',
    icon: Crown,
    iconBg: '#000000',
    iconColor: '#ffffff',
    badgeText: 'BEST SELLER',
    features: [
      'Gợi ý outfit không giới hạn',
      'Gen ảnh AI 20 lượt/tháng',
      'Lưu không giới hạn thiết kế',
      'Giảm giá 5–10% khi mua hàng',
      'Ưu tiên hỗ trợ khách hàng',
      'Badge Premium trên profile',
    ],
    cta: 'Chọn Premium',
    variant: 'primary' as const,
  },
  {
    id: 'pro',
    name: 'PRO',
    price: '499.000đ',
    period: '/tháng',
    description: 'Dành cho những ai muốn trải nghiệm tối đa và đặc quyền tuyệt đối',
    icon: Zap,
    iconBg: '#e11d48',
    iconColor: '#ffffff',
    badgeText: null,
    features: [
      'Tất cả tính năng Premium',
      'Gen ảnh AI không giới hạn',
      'Phôi áo độc quyền PRO',
      'Miễn phí vận chuyển mọi đơn',
      'Hỗ trợ ưu tiên 24/7',
      'Truy cập sớm tính năng mới',
      'Thiết kế riêng theo yêu cầu',
    ],
    cta: 'Chọn Pro',
    variant: 'accent' as const,
  },
]

// ── Component ──────────────────────────────────────────────────────────────

export function MembershipPage() {
  const handleChoosePlan = (planName: string) => {
    toast.info(
      `Tính năng đang phát triển, sẽ sớm ra mắt! (Gói ${planName})`,
      {
        description: 'ALTERA đang hoàn thiện hệ thống thanh toán. Hãy theo dõi để không bỏ lỡ!',
        duration: 4000,
      }
    )
  }

  return (
    <div className="min-h-[80vh]">

      {/* Hero */}
      <section className="text-center px-6 py-20 bg-gradient-to-b from-[var(--color-muted)]/50 to-[var(--color-background)]">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-bold uppercase tracking-wider mb-6">
          <Crown className="h-3.5 w-3.5" />
          Membership
        </div>
        <h1 className="font-heading text-5xl md:text-6xl font-bold mb-4">
          Nâng cấp trải nghiệm <br />
          <span className="text-[var(--color-accent)]">ALTERA</span>
        </h1>
        <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto">
          Mở khóa toàn bộ sức mạnh của AI thời trang. Thiết kế không giới hạn, phong cách không biên giới.
        </p>
      </section>

      {/* Plans Grid */}
      <section className="mx-auto max-w-[var(--spacing-contentMax)] px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isBestSeller = !!plan.badgeText

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-[var(--radius-xl)] border-2 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isBestSeller
                    ? 'border-[var(--color-primary)] shadow-lg'
                    : 'border-[var(--color-border)]'
                }`}
              >
                {/* Best Seller Badge */}
                {plan.badgeText && (
                  <div className="absolute top-0 left-0 right-0 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-bold tracking-widest uppercase text-center py-2 flex items-center justify-center gap-2">
                    <Star className="h-3 w-3 fill-current" />
                    {plan.badgeText}
                    <Star className="h-3 w-3 fill-current" />
                  </div>
                )}

                <div className={`flex flex-col flex-1 p-8 bg-[var(--color-background)] ${isBestSeller ? 'pt-14' : ''}`}>
                  {/* Icon & Plan Name */}
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="h-12 w-12 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: plan.iconBg }}
                    >
                      <Icon className="h-6 w-6" style={{ color: plan.iconColor }} />
                    </div>
                    <div>
                      <div className="font-heading text-xl font-bold">{plan.name}</div>
                      <div className="text-xs text-[var(--color-muted-foreground)]">{plan.description}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-4xl font-bold">{plan.price}</span>
                      <span className="text-sm text-[var(--color-muted-foreground)]">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                          <Check className="h-3 w-3 text-emerald-600 stroke-[2.5]" />
                        </div>
                        <span className="text-[var(--color-foreground)]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    variant={plan.variant}
                    size="lg"
                    className="w-full uppercase font-semibold tracking-wider"
                    onClick={() => handleChoosePlan(plan.name)}
                  >
                    {plan.cta}
                  </Button>

                  {plan.id !== 'free' && (
                    <p className="text-xs text-center text-[var(--color-muted-foreground)] mt-3">
                      Hủy bất kỳ lúc nào · Không ràng buộc
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ / Notice */}
        <div className="mt-16 text-center p-8 rounded-[var(--radius-xl)] bg-[var(--color-muted)]/40 border border-[var(--color-border)]">
          <Crown className="h-8 w-8 mx-auto mb-3 text-[var(--color-muted-foreground)] opacity-50" />
          <h3 className="font-heading text-lg font-bold mb-2">
            Hệ thống thanh toán đang được hoàn thiện
          </h3>
          <p className="text-sm text-[var(--color-muted-foreground)] max-w-lg mx-auto">
            Chúng tôi đang phát triển tích hợp thanh toán an toàn. Đăng ký nhận thông báo để nhận ưu đãi ra mắt sớm nhất!
          </p>
          <Button
            variant="outline"
            size="md"
            className="mt-4"
            onClick={() => toast.info('Tính năng đang phát triển, sẽ sớm ra mắt!', { duration: 3000 })}
          >
            Nhận thông báo ra mắt
          </Button>
        </div>
      </section>

    </div>
  )
}
