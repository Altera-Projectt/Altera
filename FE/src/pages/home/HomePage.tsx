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

import { useAuth } from '@/hooks/useAuth'



export function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuth()

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
      <section className="relative h-screen w-full overflow-hidden bg-black">
        {/* Background image */}
        <img
          src="/home1.jpg"
          alt="ALTERA Hero Visual"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-60"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 pointer-events-none" />

        {/* Chữ chìm ALTERA khổng lồ */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[20vw] font-black text-white/10 uppercase select-none">
            ALTERA
          </span>
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 text-white text-center px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] mb-4 opacity-70">
            AI Fashion Platform
          </p>
          <h1 className="heading-brand text-[clamp(3rem,10vw,8rem)] text-white mb-8">
            ALTERA
          </h1>
          <div className="flex gap-4">
            <Link to="/products">
              <Button variant="primary" size="lg"
                className="uppercase tracking-widest font-bold px-10 rounded-none">
                SHOP NOW
              </Button>
            </Link>
            <Link to="/design">
              <Button variant="outline" size="lg"
                className="uppercase tracking-widest font-bold px-10 rounded-none
                  border-white text-white hover:bg-white hover:text-black">
                DESIGN
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Marquee Text */}
      <div className="w-full overflow-hidden border-y border-[var(--color-border)]
        bg-[var(--color-primary)] py-3">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="flex items-center gap-8 pr-8
              text-xs font-bold uppercase tracking-widest text-white">
              <span>🔥 Freeship toàn quốc đơn từ 500K</span>
              <span>★</span>
              <span>New Arrivals</span>
              <span>★</span>
              <span>AI Design Studio</span>
              <span>★</span>
              <span>AI Stylist Miễn phí</span>
              <span>★</span>
              <span>Custom Shirt In Áo Theo Yêu Cầu</span>
              <span>★</span>
            </span>
          ))}
        </div>
      </div>



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
              <h2 className="font-heading text-3xl font-bold uppercase tracking-wide sm:text-4xl">
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
                src="/home2.jpg"
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
                src="/home3.jpg"
                alt="AI Outfit recommendation"
                className="h-full w-full object-cover brightness-90"
                loading="lazy"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="font-heading text-3xl font-bold uppercase tracking-wide sm:text-4xl">
                Personalized AI Styling
              </h2>
              <p className="mt-6 text-sm text-zinc-400 leading-relaxed">
                Unsure how to match colors or layers? Chat with our AI Stylist. It analyzes your aesthetic preference, weather conditions, and body fit to generate custom lookbook recommendations that coordinate seamlessly.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <>
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
                  </>
                ) : (
                  <Button asChild variant="accent" className="uppercase font-semibold tracking-wider">
                    <Link to="/auth/login" state={{ from: { pathname: '/outfit' } }} className="flex items-center gap-2">
                      Sign in for AI Stylist <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
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
              <h2 className="font-heading text-3xl font-bold uppercase tracking-wide sm:text-4xl">
                Design Your Own Canvas
              </h2>
              <p className="mt-6 text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                Take complete creative control. Upload your own PNG/SVG graphic artworks, select premium base fabrics, apply dynamic patterns, and preview your custom streetwear apparel in full 3D.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <>
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
                  </>
                ) : (
                  <Button asChild variant="primary" className="uppercase font-semibold tracking-wider">
                    <Link to="/auth/login" state={{ from: { pathname: '/design' } }} className="flex items-center gap-2">
                      Sign in to Design <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
              <img
                src="/home4.jpg"
                alt="3D design interface preview"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Featured Products */}
      <section className="py-16">
        <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6">
          <div className="flex items-end justify-between mb-8">
            <h2 className="heading-brand text-3xl md:text-5xl">
              New<br />Arrivals
            </h2>
            <Link to="/products"
              className="text-xs font-bold uppercase tracking-widest
                underline underline-offset-4 hover:opacity-60 transition-opacity">
              Xem tất cả →
            </Link>
          </div>

          {/* Horizontal scroll container */}
          <div className="snap-scroll-x gap-4 pb-4 -mx-6 px-6">
            {isLoading ? (
              // Skeleton cards
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-[260px] md:w-[300px] flex-shrink-0">
                  <div className="aspect-[3/4] bg-[var(--color-muted)] animate-pulse rounded-none" />
                  <div className="mt-3 h-4 w-3/4 bg-[var(--color-muted)] animate-pulse" />
                  <div className="mt-2 h-4 w-1/2 bg-[var(--color-muted)] animate-pulse" />
                </div>
              ))
            ) : products.length > 0 ? (
              products.map((product) => (
                <div key={product._id} className="w-[260px] md:w-[300px] flex-shrink-0">
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              <div className="w-full text-center py-12 text-[var(--color-muted-foreground)]">
                <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Catalog đang được cập nhật...</p>
              </div>
            )}
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
