import { Link } from 'react-router-dom'
import { Sparkles, Users, Palette, ArrowRight, Zap, Heart, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'

// ── Core Values Data ───────────────────────────────────────────────────────

const coreValues = [
  {
    icon: Palette,
    title: 'Design Studio',
    description:
      'Công cụ thiết kế thời trang thông minh cho phép bạn tùy chỉnh từng chi tiết — từ form dáng, màu sắc đến họa tiết — theo phong cách riêng của bạn.',
    accent: '#000000',
  },
  {
    icon: Sparkles,
    title: 'AI Stylist',
    description:
      'Trợ lý phong cách tích hợp AI hiểu gu thẩm mỹ của bạn và gợi ý outfit phù hợp với vóc dáng, dịp và xu hướng thời trang hiện đại.',
    accent: '#e11d48',
  },
  {
    icon: Users,
    title: 'Community',
    description:
      'Tham gia cộng đồng những người yêu thời trang, chia sẻ thiết kế, lấy cảm hứng từ nhau và cùng định hình xu hướng của ngày mai.',
    accent: '#6366f1',
  },
]

// ── Team Stats ─────────────────────────────────────────────────────────────

const stats = [
  { value: '10K+', label: 'Khách hàng' },
  { value: '50K+', label: 'Thiết kế đã tạo' },
  { value: '98%', label: 'Hài lòng' },
  { value: '2024', label: 'Thành lập' },
]

// ── Component ──────────────────────────────────────────────────────────────

export function AboutPage() {
  return (
    <div className="min-h-[80vh]">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-[var(--spacing-contentMax)] px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm font-medium mb-6 backdrop-blur-sm">
              <Globe className="h-4 w-4" />
              Thương hiệu thời trang AI — Made in Vietnam
            </div>
            <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Về <br />
              <span className="relative">
                ALTERA
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-[var(--color-accent)] rounded-full" />
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 leading-relaxed max-w-2xl">
              Chúng tôi tin rằng mỗi người đều có phong cách riêng — và công nghệ AI có thể giúp bạn khám phá, thể hiện và phát triển phong cách đó một cách tự nhiên nhất.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" variant="secondary" className="uppercase font-semibold tracking-wider">
                <Link to="/products">Khám phá bộ sưu tập</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 uppercase font-semibold tracking-wider">
                <Link to="/outfit">Thử AI Stylist</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-heading text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-[var(--color-muted-foreground)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-4">
              <span className="h-px w-8 bg-[var(--color-border)]" />
              Câu chuyện thương hiệu
            </div>
            <h2 className="font-heading text-4xl font-bold mb-6">
              Thời trang <br /> không có giới hạn
            </h2>
            <div className="space-y-4 text-[var(--color-muted-foreground)] leading-relaxed">
              <p>
                ALTERA ra đời từ một ý tưởng đơn giản: <strong className="text-[var(--color-foreground)]">thời trang nên phản ánh bạn, không phải ngược lại.</strong> Trong một thế giới tràn ngập xu hướng, chúng tôi muốn tạo ra một nền tảng nơi mỗi cá nhân có thể tự do thể hiện bản thân.
              </p>
              <p>
                Bằng cách kết hợp công nghệ AI tiên tiến với tư duy thời trang hiện đại, ALTERA mang đến cho bạn những công cụ để khám phá, tùy chỉnh và sở hữu phong cách riêng — từ gợi ý outfit thông minh đến studio thiết kế áo độc đáo.
              </p>
              <p>
                Chúng tôi không chỉ bán quần áo. Chúng tôi xây dựng một cộng đồng nơi phong cách được chia sẻ, truyền cảm hứng và tôn vinh.
              </p>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="aspect-square w-full rounded-[var(--radius-2xl)] overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-700 flex items-center justify-center">
              <div className="text-center text-white/60 p-12">
                <Sparkles className="h-16 w-16 mx-auto mb-4 text-white/30" />
                <p className="text-2xl font-heading font-bold text-white/80">AI × Fashion</p>
                <p className="text-sm mt-2">Nơi công nghệ gặp gỡ phong cách</p>
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-[var(--color-accent)] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              Made in VN 🇻🇳
            </div>
            <div className="absolute -bottom-4 -left-4 bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
              50K+ thiết kế đã tạo
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-[var(--color-muted)]/40 py-20">
        <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-4">
              <span className="h-px w-8 bg-[var(--color-border)]" />
              Giá trị cốt lõi
              <span className="h-px w-8 bg-[var(--color-border)]" />
            </div>
            <h2 className="font-heading text-4xl font-bold">Ba trụ cột của ALTERA</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreValues.map((value) => {
              const Icon = value.icon
              return (
                <div
                  key={value.title}
                  className="bg-[var(--color-background)] rounded-[var(--radius-xl)] p-8 border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div
                    className="h-12 w-12 rounded-[var(--radius-lg)] flex items-center justify-center mb-6"
                    style={{ backgroundColor: value.accent + '15', color: value.accent }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-xl font-bold mb-3">{value.title}</h3>
                  <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                    {value.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <Zap className="h-10 w-10 mx-auto mb-6 text-[var(--color-accent)]" />
          <blockquote className="font-heading text-3xl md:text-4xl font-bold leading-tight mb-6">
            "Chúng tôi tin rằng mỗi người đều có phong cách riêng — ALTERA ở đây để giúp bạn tìm ra nó."
          </blockquote>
          <p className="text-[var(--color-muted-foreground)] mb-10 text-lg">
            — Đội ngũ ALTERA
          </p>
          <Button asChild size="xl" className="uppercase font-semibold tracking-wider">
            <Link to="/membership">
              Tham gia cộng đồng ALTERA
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

    </div>
  )
}
