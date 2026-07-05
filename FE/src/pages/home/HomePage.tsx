import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  Cpu,
  ShieldCheck,
  Leaf,
  Heart,
  Crown,
  Palette,
  Info,
  ShoppingBag,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/fashion'
import { ProductService } from '@/services/product.api'
import type { Product } from '@/types/product.types'
import { cn } from '@/utils/cn'

// ── Quick-nav cards for newly added pages ─────────────────────────────────

const NEW_PAGES = [
  {
    to: '/wishlist',
    icon: Heart,
    label: 'Yêu thích',
    description: 'Sản phẩm đã lưu của bạn',
    accent: '#e11d48',
    bg: '#fff1f2',
  },
  {
    to: '/designs',
    icon: Palette,
    label: 'Thiết kế của tôi',
    description: 'Xem & quản lý thiết kế đã lưu',
    accent: '#6366f1',
    bg: '#eef2ff',
  },
  {
    to: '/membership',
    icon: Crown,
    label: 'Membership',
    description: 'Nâng cấp trải nghiệm ALTERA',
    accent: '#000000',
    bg: '#f5f5f5',
  },
  {
    to: '/about',
    icon: Info,
    label: 'Về ALTERA',
    description: 'Câu chuyện & giá trị thương hiệu',
    accent: '#059669',
    bg: '#ecfdf5',
  },
]

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        const response = await ProductService.getProducts({ limit: 4 })
        if (response.data?.data?.products && response.data.data.products.length > 0) {
          setProducts(response.data.data.products)
        } else {
          setProducts([])
        }
      } catch (err) {
        console.warn('Backend offline or empty.', err)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchFeaturedProducts()
  }, [])

  return (
    <div className="flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      {/* 1. Hero Section */}
      <section className="relative flex h-[90vh] min-h-[600px] w-full items-center justify-center overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80"
            alt="ALTERA Hero Visual"
            className="h-full w-full object-cover object-center opacity-40 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>

        <div className="relative z-10 mx-auto max-w-[var(--spacing-contentMax)] px-6 text-center text-white flex flex-col items-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-300"
          >
            Gen-Z AI Fashion Platform
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-4 font-heading text-5xl font-normal uppercase tracking-widest sm:text-7xl lg:text-8xl"
          >
            Evolve Your Style
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-6 max-w-lg text-sm font-light leading-relaxed text-zinc-300 sm:text-base"
          >
            Design custom clothing in 3D, get tailored outfit recommendations driven by AI, and showcase your signature aesthetic.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6"
          >
            <Button asChild variant="secondary" size="lg" className="bg-white text-black hover:bg-zinc-200 uppercase font-semibold tracking-wider px-10">
              <Link to="/products">Shop Catalog</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black uppercase font-semibold tracking-wider px-10">
              <Link to="/design" className="flex items-center gap-2">
                3D Studio <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 2. Quick Navigate — New Pages */}
      <section className="py-16 border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
              Khám phá thêm
            </span>
            <h2 className="mt-2 font-heading text-2xl font-bold uppercase tracking-wide">
              Tính năng mới
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {NEW_PAGES.map(({ to, icon: Icon, label, description, accent, bg }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col items-center gap-3 p-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-background)] text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-transparent"
                style={{ ['--hover-bg' as any]: bg }}
              >
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: bg, color: accent }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm">{label}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 leading-snug">{description}</p>
                </div>
                <ArrowRight
                  className="h-4 w-4 text-[var(--color-muted-foreground)] transition-all duration-300 group-hover:translate-x-1"
                  style={{ color: accent }}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Sustainable Fashion Section */}
      <section className="py-24 border-b border-[var(--color-border)]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto max-w-[var(--spacing-contentMax)] px-6"
        >
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-[var(--color-foreground)]">
                <Leaf className="h-5 w-5" />
              </div>
              <h2 className="mt-6 font-heading text-3xl font-bold uppercase tracking-wide sm:text-4xl">
                Eco-Friendly &amp; Sustainable
              </h2>
              <p className="mt-6 text-sm text-[var(--color-muted-foreground)] leading-relaxed max-w-md">
                ALTERA is committed to reducing environmental impact. Our custom studio generates patterns directly for production, ensuring zero inventory waste. We prioritize organic materials, ethical labor, and circular design principles.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-heading text-lg font-semibold text-[var(--color-foreground)]">100% Organic</h4>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Finest GOTS certified organic fibers</p>
                </div>
                <div>
                  <h4 className="font-heading text-lg font-semibold text-[var(--color-foreground)]">Zero Waste</h4>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">On-demand production prints only what is needed</p>
                </div>
              </div>
              <div className="mt-10">
                <Button asChild variant="outline" className="uppercase font-semibold tracking-wider px-8">
                  <Link to="/about" className="flex items-center gap-2">
                    Our Story <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)] shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80"
                alt="Sustainable production"
                className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
                loading="lazy"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. AI Stylist Section */}
      <section className="bg-zinc-950 py-24 text-white">
        <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-zinc-900">
              <img
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80"
                alt="AI Outfit recommendation"
                className="h-full w-full object-cover brightness-90"
                loading="lazy"
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-500">
                <Sparkles className="h-3.5 w-3.5" /> AI Outfit Stylist
              </span>
              <h2 className="mt-4 font-heading text-3xl font-bold uppercase tracking-wide sm:text-4xl">
                Personalized AI Styling
              </h2>
              <p className="mt-6 text-sm text-zinc-400 leading-relaxed">
                Unsure how to match colors or layers? Chat with our AI Stylist. It analyzes your aesthetic preference, weather conditions, and body fit to generate custom lookbook recommendations that coordinate seamlessly.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="accent" className="uppercase font-semibold tracking-wider">
                  <Link to="/outfit" className="flex items-center gap-2">
                    Try AI Stylist <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 uppercase font-semibold tracking-wider">
                  <Link to="/chat" className="flex items-center gap-2">
                    AI Chat
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Custom Design Studio Section */}
      <section className="py-24 border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-500">
                <Cpu className="h-3.5 w-3.5" /> 3D Design Studio
              </span>
              <h2 className="mt-4 font-heading text-3xl font-bold uppercase tracking-wide sm:text-4xl">
                Design Your Own Canvas
              </h2>
              <p className="mt-6 text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                Take complete creative control. Upload your own PNG/SVG graphic artworks, select premium base fabrics, apply dynamic patterns, and preview your custom streetwear apparel in full 3D.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="primary" className="uppercase font-semibold tracking-wider">
                  <Link to="/design" className="flex items-center gap-2">
                    Launch 3D Studio <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="uppercase font-semibold tracking-wider">
                  <Link to="/designs" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" /> My Designs
                  </Link>
                </Button>
              </div>
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
              <img
                src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80"
                alt="3D design interface preview"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Featured Products */}
      <section className="py-28 bg-[var(--color-background)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-between gap-6 md:flex-row mb-16"
          >
            <div>
              <h2 className="font-heading text-3xl font-normal uppercase tracking-widest">
                Featured Catalog
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                Our latest trend-setting minimalist essentials
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="uppercase font-semibold tracking-wider rounded-none">
                <Link to="/products">View All Products</Link>
              </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-12">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={cn("flex flex-col space-y-4", i === 0 || i === 3 ? "lg:col-span-7" : "lg:col-span-5")}>
                  <div className="aspect-[3/4] w-full animate-pulse rounded-[var(--radius-md)] bg-zinc-200 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
                  <div className="h-4 w-2/3 bg-zinc-200" />
                  <div className="h-4 w-1/3 bg-zinc-200" />
                </div>
              ))
              : products.length > 0
                ? products.map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className={cn(i === 0 || i === 3 ? "lg:col-span-7" : "lg:col-span-5")}
                  >
                    <ProductCard product={product} className="h-full w-full" />
                  </motion.div>
                ))
                : (
                  <div className="col-span-full text-center py-12 text-[var(--color-muted-foreground)]">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Catalog đang được cập nhật...</p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <Link to="/products">Xem tất cả sản phẩm</Link>
                    </Button>
                  </div>
                )
            }
          </div>
        </div>
      </section>

      {/* 7. Membership CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white">
        <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
            <div className="md:col-span-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider mb-4">
                <Crown className="h-3.5 w-3.5 text-yellow-400" />
                ALTERA Membership
              </div>
              <h2 className="font-heading text-3xl font-bold uppercase tracking-wide">
                Nâng cấp trải nghiệm của bạn
              </h2>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-lg">
                Từ gói FREE đến PRO — mở khóa outfit AI không giới hạn, thiết kế độc quyền, và ưu đãi mua sắm mỗi tháng.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-3">
              <Button asChild variant="accent" size="lg" className="uppercase font-semibold tracking-wider w-full md:w-auto">
                <Link to="/membership" className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Xem các gói
                </Link>
              </Button>
              <Button asChild variant="ghost" size="md" className="text-zinc-400 hover:text-white uppercase font-semibold tracking-wider w-full md:w-auto">
                <Link to="/about">Tìm hiểu về ALTERA</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Testimonials */}
      <section className="py-24 border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 text-center">
          <h2 className="font-heading text-3xl font-bold uppercase tracking-wide">
            Loved By Gen-Z
          </h2>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] p-8 text-left transition-all hover:shadow-md">
              <p className="text-sm font-light italic leading-relaxed text-[var(--color-muted-foreground)]">
                "The 3D custom shirt designer is insane. I uploaded my graphics, customized the t-shirt color, and the final print came out exactly how I previewed it!"
              </p>
              <div className="mt-8">
                <h5 className="font-heading text-sm font-bold">Alex Carter</h5>
                <p className="text-xs text-[var(--color-muted-foreground)]">Digital Artist</p>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] p-8 text-left transition-all hover:shadow-md">
              <p className="text-sm font-light italic leading-relaxed text-[var(--color-muted-foreground)]">
                "The AI Outfit Recommendation tool is a lifesaver. It suggested a perfect mix-and-match coat and boots combo that I wouldn't have thought to pair myself."
              </p>
              <div className="mt-8">
                <h5 className="font-heading text-sm font-bold">Sophia Nguyen</h5>
                <p className="text-xs text-[var(--color-muted-foreground)]">Fashion Blogger</p>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] p-8 text-left transition-all hover:shadow-md">
              <p className="text-sm font-light italic leading-relaxed text-[var(--color-muted-foreground)]">
                "On-demand printing means zero waste, which is super important to me. High quality prints combined with a great environmental mindset."
              </p>
              <div className="mt-8">
                <h5 className="font-heading text-sm font-bold">Jordan Lee</h5>
                <p className="text-xs text-[var(--color-muted-foreground)]">Eco Activist</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. CTA Section */}
      <section className="bg-[var(--color-foreground)] text-[var(--color-background)] py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-heading text-3xl font-black uppercase tracking-wider sm:text-4xl">
            Join the ALTERA Movement
          </h2>
          <p className="mt-4 text-sm font-light opacity-80 leading-relaxed">
            Subscribe to our newsletter to receive curated styling drops, exclusive designer collaborations, and early access to drops.
          </p>
          <form className="mt-10 flex flex-col gap-3 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 h-12 px-4 rounded-[var(--radius-md)] border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
            <Button variant="accent" size="lg" className="h-12 uppercase font-semibold tracking-wider whitespace-nowrap">
              Subscribe
            </Button>
          </form>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs opacity-60">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" /> Secure checkout
            </span>
            <span>•</span>
            <span>Easy returns</span>
            <span>•</span>
            <Link to="/about" className="hover:opacity-100 underline underline-offset-2 transition-opacity">
              Về ALTERA
            </Link>
            <span>•</span>
            <Link to="/membership" className="hover:opacity-100 underline underline-offset-2 transition-opacity">
              Membership
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
