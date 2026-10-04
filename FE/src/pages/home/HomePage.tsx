import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import homepage0 from '@/assets/homepage0.png'
import homepage1 from '@/assets/homepage1.jpg'
import homepage2 from '@/assets/homepage2.jpg'
import logoSvg from '@/assets/logo2.png'
import { MarketplaceService, type MarketplaceDesign } from '@/services/marketplace.api'

const FEATURES = [
  {
    title: 'Shop Collection',
    path: '/marketplace',
    tags: ['Curated Styles', 'Premium Quality', 'Seasonal Drops']
  },
  {
    title: 'AI Stylist',
    path: '/outfit',
    tags: ['Smart Pairing', 'Personalized Fits', 'Trend Analysis']
  },
  {
    title: 'Design Studio',
    path: '/design',
    tags: ['3D Customization', 'Fabric Selection', 'Real-time Preview']
  },
  {
    title: 'Membership',
    path: '/membership',
    tags: ['Exclusive Perks', 'Early Access', 'Priority Support']
  }
]

export function HomePage() {
  const [trending, setTrending] = useState<MarketplaceDesign[]>([])
  useEffect(() => {
    let active = true
    MarketplaceService.list({ sort: 'Best Selling', limit: 4 }).then(({ data }) => {
      if (active) setTrending(data.data.designs)
    }).catch(() => { if (active) setTrending([]) })
    return () => { active = false }
  }, [])

  return (
    <div className="flex flex-col bg-white text-black overflow-hidden font-body selection:bg-electric-blue selection:text-white">
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — HERO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative flex min-h-[76dvh] items-end overflow-hidden bg-neutral-950 px-6 pb-14 pt-28 text-white md:min-h-[82dvh] md:px-12 md:pb-20">
        <img src={homepage1} alt="ALTERA custom fashion" className="absolute inset-0 h-full w-full object-cover opacity-65" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" />
        <motion.div className="relative mx-auto w-full max-w-7xl" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.24em]">ALTERA · Wear your own idea</p>
          <h1 className="max-w-4xl text-5xl font-black uppercase leading-[.94] tracking-tight md:text-8xl">Khám phá thiết kế độc đáo</h1>
          <p className="mt-5 max-w-xl text-sm text-white/80 md:text-base">Chọn thiết kế từ cộng đồng hoặc tự tạo chiếc áo mang dấu ấn của bạn.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/marketplace" className="bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-neutral-200">Khám phá ngay</Link><Link to="/design" className="border border-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-black">Thiết kế áo</Link></div>
        </motion.div>
      </section>

      <section className="bg-white px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-neutral-200 pb-5"><div><p className="text-xs uppercase tracking-[.2em] text-neutral-500">From the community</p><h2 className="mt-2 text-3xl font-bold uppercase tracking-tight">Creator best sellers</h2></div><Link to="/marketplace" className="text-xs font-semibold uppercase tracking-widest underline">Explore market</Link></div>
          {trending.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">{trending.map((design) => <Link to={`/design/${design.slug}`} key={design._id} className="group"><div className="aspect-[4/5] overflow-hidden bg-neutral-100"><img src={design.thumbnail} alt={design.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"/></div><h3 className="mt-3 truncate text-sm font-semibold uppercase">{design.name}</h3><p className="mt-1 text-xs text-neutral-500">{design.price.toLocaleString('vi-VN')} ₫ · {design.designerId.displayName}</p></Link>)}</div> : <div className="border-y border-neutral-200 py-14 text-center text-sm text-neutral-500"><p>Chưa có thiết kế được duyệt.</p><Link to="/design" className="mt-3 inline-block font-semibold text-black underline">Tạo thiết kế đầu tiên</Link></div>}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — SUB-HERO / MISSION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-electric-blue text-white py-32 md:py-48 px-6 flex flex-col items-center justify-center text-center">
        <div className="max-w-5xl flex flex-col items-center">
          <div className="flex items-center gap-2 mb-10 text-[10px] font-bold uppercase tracking-widest mix-blend-multiply">
            <img src={logoSvg} alt="ALTERA Logo" className="h-6 w-auto object-contain" />
          </div>
          <h2 className="font-body text-3xl md:text-5xl lg:text-6xl font-light leading-[1.15] tracking-wide mb-16 text-balance max-w-4xl mx-auto text-white/90">
            We bring architecture to life through craft and innovation. Trusted by architects who demand precision, beauty, and care.
          </h2>
          <Button asChild variant="primary" className="bg-black text-white hover:bg-neutral-800 rounded-none px-12 py-6 uppercase tracking-widest font-bold text-xs border-none">
            <Link to="/marketplace">Shop <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3 — SHIRT / WHAT IS THE SETBY (Image 3)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white text-black pt-12 pb-20">
        <div className="max-w-[var(--spacing-contentMax)] mx-auto px-6">
          <div className="border-t-[8px] border-[#00E5FF] pt-10 mb-20">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-3 flex items-center">
                <img src={logoSvg} alt="ALTERA Logo" className="h-8 md:h-10 w-auto object-contain" />
              </div>
              <div className="md:col-span-3">
                <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 leading-tight">
                  What Is The<br/>Setby
                </p>
              </div>
              <div className="md:col-span-6">
                <p className="text-sm tracking-tight text-gray-700 leading-relaxed font-medium max-w-md">
                  At <span className="font-bold italic text-black">Setby</span>, we're on a mission to bring life into every space — just like sunlight breaking through a window.
                </p>
              </div>
            </div>
          </div>

          {/* 3D Shirt with Precise Callouts */}
          <div className="relative flex justify-center items-center h-[50vh] md:h-[70vh] mb-10 max-w-5xl mx-auto">
            <img src={homepage0} alt="3D Custom Shirt" className="h-full object-contain relative z-10 drop-shadow-2xl" />
            
            {/* Top Left Callout */}
            <div className="absolute top-[25%] left-[15%] md:left-[25%] hidden md:flex items-center z-20">
              <div className="text-[9px] font-bold text-black text-right mr-3 leading-tight tracking-widest uppercase">Guaranteed<br/>Security</div>
              <div className="w-8 h-px bg-electric-blue relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-electric-blue rounded-full"></div>
              </div>
              <div className="w-px h-12 bg-electric-blue"></div>
              <div className="w-10 h-10 bg-white border border-black shadow-[3px_3px_0px_#000] -ml-5 -mt-12"></div>
            </div>

            {/* Bottom Left Callout */}
            <div className="absolute bottom-[20%] left-[20%] md:left-[30%] hidden md:flex items-center z-20">
              <div className="text-[9px] font-bold text-black text-right mr-3 leading-tight tracking-widest uppercase">Real time<br/>tracking</div>
              <div className="w-6 h-px bg-electric-blue relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-electric-blue rounded-full"></div>
              </div>
              <div className="w-px h-10 bg-electric-blue"></div>
              <div className="w-10 h-10 bg-white border border-black shadow-[3px_3px_0px_#000] -ml-5 mt-10"></div>
            </div>

            {/* Top Right Callout */}
            <div className="absolute top-[35%] right-[15%] md:right-[25%] hidden md:flex items-center flex-row-reverse z-20">
              <div className="text-[9px] font-bold text-black text-left ml-3 leading-tight tracking-widest uppercase">On time<br/>Delivery</div>
              <div className="w-8 h-px bg-electric-blue relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-electric-blue rounded-full"></div>
              </div>
              <div className="w-px h-16 bg-electric-blue"></div>
              <div className="w-10 h-10 bg-white border border-black shadow-[3px_3px_0px_#000] -mr-5 -mt-16"></div>
            </div>

            {/* Bottom Right Callout */}
            <div className="absolute bottom-[15%] right-[25%] md:right-[32%] hidden md:flex items-center flex-row-reverse z-20">
              <div className="text-[9px] font-bold text-black text-left ml-3 leading-tight tracking-widest uppercase">24/7 Support</div>
              <div className="w-10 h-px bg-electric-blue relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-electric-blue rounded-full"></div>
              </div>
              <div className="w-px h-10 bg-electric-blue"></div>
              <div className="w-10 h-10 bg-white border border-black shadow-[3px_3px_0px_#000] -mr-5 -mt-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — FEATURED PROJECTS LIST (Image 2)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white text-black py-20 pb-40">
        <div className="max-w-[var(--spacing-contentMax)] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-24">
            <div className="md:col-span-4 text-[10px] font-bold uppercase tracking-widest flex items-start gap-2 text-black pt-2">
              <span className="w-3 h-3 bg-black transform rotate-45 mt-0.5"></span> FEATURED PROJECTS
            </div>
            <div className="md:col-span-8 flex flex-col items-start">
              <h2 className="heading-brand text-5xl md:text-7xl tracking-tighter leading-[0.9] text-black mb-10 max-w-3xl">
                Every project tells its own story of collab and performance.
              </h2>
              <Button asChild className="bg-gradient-brand text-white px-8 py-6 rounded-sm text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 hover:opacity-90 border-none shadow-xl shadow-blue-500/20">
                <Link to="/products">Who we are <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
            </div>
          </div>

          {/* The List Layout */}
          <div className="border-t border-gray-300 relative group">
            
            {/* Fixed Floating Image as requested */}
            <div className="absolute left-[20%] top-1/2 -translate-y-1/2 z-20 pointer-events-none rotate-[10deg] drop-shadow-2xl">
              <img src={homepage1} className="w-56 h-72 object-cover border-[6px] border-white shadow-2xl" alt="Platform Features" />
            </div>

            {FEATURES.map((item, i) => (
              <Link 
                to={item.path} 
                key={item.title} 
                className={`grid grid-cols-1 md:grid-cols-12 items-center py-10 md:py-12 border-b border-gray-200 transition-colors ${i === 0 ? 'text-black' : 'text-gray-400 hover:text-black'}`}
              >
                <div className="md:col-span-5 mb-4 md:mb-0 relative z-30">
                  <span className="heading-brand text-4xl md:text-5xl tracking-tighter block uppercase">{item.title}</span>
                </div>
                <div className="md:col-span-6 flex flex-wrap gap-3 relative z-30">
                  {item.tags.map(tag => (
                    <span key={tag} className="border border-current px-4 py-1.5 rounded-full text-[9px] uppercase tracking-widest font-bold bg-white/50 backdrop-blur-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="md:col-span-1 flex justify-start md:justify-end mt-4 md:mt-0 relative z-30">
                  <ArrowRight className="h-5 w-5 opacity-50" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — SHOWCASE
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-[#111111] text-white py-32 px-6 min-h-[90vh] flex flex-col justify-center relative overflow-hidden">
        {/* Background Image w/ Overlay */}
        <div className="absolute inset-0 z-0">
          <img src={homepage2} alt="Showcase" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-[#111111]"></div>
        </div>
        
        <div className="max-w-[var(--spacing-contentMax)] mx-auto w-full relative z-10 flex flex-col justify-center h-full">
          <div className="heading-brand text-[clamp(4rem,12vw,10rem)] leading-[0.85] tracking-tighter flex flex-col">
            <motion.div 
              initial={{ x: -50, opacity: 0 }} 
              whileInView={{ x: 0, opacity: 1 }} 
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Make it.
            </motion.div>
            <motion.div 
              initial={{ opacity: 0 }} 
              whileInView={{ opacity: 1 }} 
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-center mt-8 md:mt-16 text-gray-400"
            >
              Wear it.
            </motion.div>
            <motion.div 
              initial={{ x: 50, opacity: 0 }} 
              whileInView={{ x: 0, opacity: 1 }} 
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-right mt-8 md:mt-16 text-white"
            >
              Own it.
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  )
}
