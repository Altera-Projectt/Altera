import { motion } from 'framer-motion'
import { ProcessCard } from '@/components/ui/ProcessCard'
import homepage0 from '@/assets/homepage0.png'
import about2 from '@/assets/about2.png'
import logoSvg from '@/assets/logo1.png'

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-black overflow-hidden font-body selection:bg-electric-blue selection:text-white">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — HERO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative min-h-[90vh] flex flex-col justify-center px-6 md:px-12 pt-24 overflow-hidden bg-white">
        <div className="w-full max-w-[var(--spacing-contentMax)] mx-auto flex justify-between items-center mb-12 font-bold uppercase tracking-widest z-20 relative">
          <img src={logoSvg} alt="ALTERA Logo" className="h-6 md:h-10 w-auto object-contain" />
          <span className="text-electric-blue text-[10px]">ABOUT US</span>
        </div>

        <div className="w-full max-w-[var(--spacing-contentMax)] mx-auto relative z-10 flex flex-col lg:flex-row justify-between items-center mt-12 md:mt-24">
          <div className="w-full lg:w-[60%] relative z-30">
            <motion.h1
              className="font-heading text-[clamp(6rem,20vw,16rem)] leading-[0.75] tracking-tighter text-electric-blue uppercase font-black"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            >
              <span className="text-transparent" style={{ WebkitTextStroke: '4px #0011FF' }}>WHO</span> <br />
              WE ARE?
            </motion.h1>
            <motion.p
              className="mt-16 text-sm md:text-base font-medium leading-relaxed max-w-sm text-black tracking-tight ml-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              ALTERA uses AI-powered tools that help you discover your personal style, design clothing based on your ideas, and order custom-tailored products crafted uniquely for you.
            </motion.p>
          </div>

          {/* Desktop Huge Image */}
          <div className="hidden lg:block absolute right-[-5%] top-1/2 -translate-y-1/2 w-[60%] max-w-[1000px] z-20">
            <motion.img
              src={homepage0}
              alt="About Hero Visual"
              className="w-full h-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.3)] opacity-100 mix-blend-normal cursor-pointer"
              initial={{ opacity: 0, scale: 0.9, x: 100, y: 0 }}
              animate={{ opacity: 1, scale: 1.15, x: 40, y: -40 }}
              whileHover={{ scale: 1.2, transition: { duration: 0.4 } }}
              transition={{ duration: 1.2 }}
            />
          </div>

          {/* Mobile version */}
          <div className="w-full lg:hidden relative mt-16 flex justify-center z-20">
            <motion.img
              src={homepage0}
              alt="About Hero Visual"
              className="w-full max-w-[500px] object-contain drop-shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2 }}
            />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — MASSIVE BLOCK
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-electric-blue text-white py-32 md:py-48 px-6">
        <div className="max-w-[var(--spacing-contentMax)] mx-auto flex flex-col items-start">
          <p className="max-w-2xl text-lg md:text-2xl leading-relaxed tracking-tight mb-24 md:mb-40 font-light text-left">
            Fashion is not just about what you wear, it's about how you express yourself. <br /><br />
            ALTERA was born out of a desire to make fashion creation easier. We believe everyone deserves to own clothing that reflects their unique personality, rather than simply choosing from ready-made templates. <br /><br />
            With the assistance of AI, finding your style, designing clothes, and ordering custom tailoring has become faster, more intuitive, and more accessible than ever.
          </p>
          <h2 className="heading-brand text-[clamp(5rem,20vw,16rem)] tracking-tighter leading-none text-white w-full text-right self-end">
            ALTERA
          </h2>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3 — HOW IT WORKS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white py-32 md:py-48 px-6">
        <div className="max-w-[var(--spacing-contentMax)] mx-auto">
          {/* Header */}
          <div className="flex justify-between items-end mb-24 w-full">
            <h2 className="font-heading text-[clamp(4rem,10vw,8rem)] tracking-tighter leading-none text-electric-blue font-black w-full flex flex-col md:flex-row justify-between uppercase">
              <div className="flex gap-4 md:gap-8">
                <span className="text-transparent" style={{ WebkitTextStroke: '3px #0011FF' }}>HOW</span>
                <span>ALTERA</span>
              </div>
              <span className="text-transparent mt-4 md:mt-0" style={{ WebkitTextStroke: '3px #0011FF' }}>WORKS</span>
            </h2>
          </div>

          {/* Staggered Numbered Grid with ProcessCard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 relative w-full h-auto md:h-[600px] mt-12 items-center">
            {/* Step 1 */}
            <div className="md:translate-y-[-60px]">
              <ProcessCard number="01" title={"Discover\nYour Style"} />
            </div>

            {/* Step 2 */}
            <div className="md:translate-y-[60px]">
              <ProcessCard number="02" title={"Design\nYour Clothing"} />
            </div>

            {/* Step 3 */}
            <div className="md:translate-y-[-60px]">
              <ProcessCard number="03" title={"Order Your\nCustom Piece"} />
            </div>

            {/* Step 4 */}
            <div className="md:translate-y-[60px]">
              <ProcessCard number="04" title={"Share\nYour Design"} />
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — OUR VALUES
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-gradient-to-b from-[#0011FF] to-[#00C8FF] pt-24 pb-16 px-6 overflow-hidden relative flex flex-col justify-between min-h-screen">
        <div className="w-full max-w-[var(--spacing-contentMax)] mx-auto relative z-20 flex flex-col items-center justify-center h-full pt-10">

          {/* Jacket with Precise Callouts */}
          <div className="relative flex justify-center items-center h-[50vh] md:h-[70vh] w-full max-w-5xl mx-auto mb-16 z-30">
            <img src={about2} alt="Values Context" className="h-full object-contain relative z-20 drop-shadow-2xl" />

            {/* Top Left Callout (Personalization) */}
            <div className="absolute top-[20%] left-[10%] md:left-[15%] hidden md:flex items-center z-30 group">
              <div className="text-[10px] text-white text-right mr-3 leading-tight tracking-widest uppercase">
                <span className="font-heading font-black text-sm block mb-1">PERSONALIZATION</span>
                <span className="opacity-80 lowercase font-medium tracking-normal text-[11px] leading-tight block w-40">Each design reflects the unique personality and style of the wearer</span>
              </div>
              <div className="w-8 h-px bg-white relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
              </div>
              <div className="w-px h-16 bg-white"></div>
              <div className="w-14 h-14 border border-white/40 bg-black/10 backdrop-blur-md -ml-7 -mt-16 rounded-sm shadow-sm"></div>
            </div>

            {/* Bottom Left Callout (Creativity) */}
            <div className="absolute bottom-[25%] left-[5%] md:left-[10%] hidden md:flex items-center z-30 group">
              <div className="text-[10px] text-white text-right mr-3 leading-tight tracking-widest uppercase">
                <span className="font-heading font-black text-sm block mb-1">CREATIVITY</span>
                <span className="opacity-80 lowercase font-medium tracking-normal text-[11px] leading-tight block w-40">Encouraging everyone to freely express their ideas without limitations</span>
              </div>
              <div className="w-6 h-px bg-white relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
              </div>
              <div className="w-px h-10 bg-white"></div>
              <div className="w-14 h-14 border border-white/40 bg-black/10 backdrop-blur-md -ml-7 mt-10 rounded-sm shadow-sm"></div>
            </div>

            {/* Top Right Callout (Technology) */}
            <div className="absolute top-[25%] right-[5%] md:right-[15%] hidden md:flex items-center flex-row-reverse z-30 group">
              <div className="text-[10px] text-white text-left ml-3 leading-tight tracking-widest uppercase">
                <span className="font-heading font-black text-sm block mb-1">TECHNOLOGY</span>
                <span className="opacity-80 lowercase font-medium tracking-normal text-[11px] leading-tight block w-40">Applying AI to simplify the fashion discovery and design process</span>
              </div>
              <div className="w-12 h-px bg-white relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
              </div>
              <div className="w-px h-12 bg-white"></div>
              <div className="w-14 h-14 border border-white/40 bg-black/10 backdrop-blur-md -mr-7 -mt-12 rounded-sm shadow-sm"></div>
            </div>

            {/* Bottom Right Callout (Sustainability) */}
            <div className="absolute bottom-[20%] right-[10%] md:right-[20%] hidden md:flex items-center flex-row-reverse z-30 group">
              <div className="text-[10px] text-white text-left ml-3 leading-tight tracking-widest uppercase">
                <span className="font-heading font-black text-sm block mb-1">SUSTAINABILITY</span>
                <span className="opacity-80 lowercase font-medium tracking-normal text-[11px] leading-tight block w-40">Prioritizing on-demand production and solutions that minimize environmental impact</span>
              </div>
              <div className="w-16 h-px bg-white relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
              </div>
              <div className="w-px h-16 bg-white"></div>
              <div className="w-14 h-14 border border-white/40 bg-black/10 backdrop-blur-md -mr-7 -mt-16 rounded-sm shadow-sm"></div>
            </div>

            {/* The Rock (Simulated using a background or image placed bottom-center) */}
            <div className="absolute bottom-[-15%] md:bottom-[-20%] left-1/2 -translate-x-1/2 w-[80%] md:w-[60%] h-48 bg-black rounded-[50%] blur-3xl opacity-50 z-10"></div>
          </div>
        </div>

        {/* Bleeding bottom text */}
        <h2 className="absolute bottom-0 left-0 w-full text-center font-heading font-black text-[clamp(8rem,25vw,22rem)] tracking-tighter leading-[0.75] text-white z-0 opacity-100 mix-blend-overlay uppercase pointer-events-none mb-[-2rem] md:mb-[-4rem]">
          OUR VALUES
        </h2>
      </section>

    </div>
  )
}
