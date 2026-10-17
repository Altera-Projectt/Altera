import { motion } from 'framer-motion'
import { ProcessCard } from '@/components/ui/ProcessCard'
import homepage0 from '@/assets/homepage0.png'
import about2 from '@/assets/about2.png'
import logoSvg from '@/assets/logo1.png'

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-black overflow-hidden font-body selection:bg-electric-blue selection:text-white">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — HERO ("WHO WE ARE?")
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative min-h-[88vh] flex flex-col justify-center px-6 md:px-12 pt-24 pb-12 overflow-hidden bg-white">
        <div className="w-full max-w-6xl mx-auto flex justify-between items-center mb-6 md:mb-10 font-bold uppercase tracking-widest z-20 relative">
          <img src={logoSvg} alt="ALTERA Logo" className="h-6 md:h-10 w-auto object-contain" />
          <span className="text-[#0011FF] text-[11px] tracking-[0.2em]">VỀ ALTERA</span>
        </div>

        <div className="w-full max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 items-center">
          <div className="lg:col-span-7 relative z-30">
            <span className="text-[#0011FF] text-xs font-bold uppercase tracking-[0.25em] mb-3 block">
              VỀ ALTERA
            </span>
            <motion.h1
              className="font-heading text-[clamp(4.2rem,10.5vw,9.2rem)] leading-[0.88] tracking-tight uppercase font-black bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 bg-clip-text text-transparent select-none"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9 }}
            >
              WHO <br />
              <span className="whitespace-nowrap">WE ARE?</span>
            </motion.h1>
            <motion.p
              className="font-rader mt-6 md:mt-8 text-sm md:text-base font-normal leading-relaxed max-w-lg text-blue-950/90 tracking-normal ml-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              ALTERA ứng dụng công cụ AI tiên tiến giúp bạn khám phá phong cách cá nhân, tự do thiết kế trang phục theo ý tưởng và đặt may áo đo ni đóng giày dành riêng cho chính bạn.
            </motion.p>
          </div>

          {/* 3D Visual pulled closer to "WHO WE ARE?" */}
          <div className="lg:col-span-5 relative z-20 flex justify-center lg:justify-start -mt-2 lg:mt-0 lg:-ml-16 xl:-ml-24">
            <motion.img
              src={homepage0}
              alt="About Hero Visual"
              className="w-full max-w-[460px] lg:max-w-none lg:w-[130%] xl:w-[140%] h-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.22)] select-none cursor-pointer transform scale-105 hover:scale-110 transition-transform duration-500"
              initial={{ opacity: 0, scale: 0.95, x: 30 }}
              animate={{ opacity: 1, scale: 1.05, x: 0 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — MASSIVE BLOCK
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="section2" className="relative overflow-hidden min-h-[85vh] lg:min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#0017FF] via-[#008DFF] to-[#00CBFF] text-white pt-20 md:pt-28 pb-4 md:pb-6 px-6 md:px-12 lg:px-16">
        <div className="max-w-[var(--spacing-contentMax)] w-full mx-auto relative z-10 my-auto">
          <div className="max-w-xl lg:max-w-2xl space-y-6 md:space-y-8">
            <p className="font-rader text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed md:leading-[1.7] tracking-normal font-normal text-white text-left">
              Thời trang không chỉ là những gì bạn mặc, đó là cách bạn thể hiện bản sắc của chính mình.
            </p>
            <p className="font-rader text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed md:leading-[1.7] tracking-normal font-normal text-white text-left">
              ALTERA ra đời từ mong muốn đơn giản hóa việc sáng tạo thời trang. Chúng tôi tin rằng mỗi người đều xứng đáng sở hữu trang phục mang đậm dấu ấn cá nhân thay vì chỉ chọn từ những khuôn mẫu may sẵn.
            </p>
            <p className="font-rader text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed md:leading-[1.7] tracking-normal font-normal text-white text-left">
              Với sự đồng hành của AI, việc định hình phong cách, thiết kế áo và đặt in may theo yêu cầu trở nên nhanh chóng, trực quan và dễ dàng hơn bao giờ hết.
            </p>
          </div>
        </div>

        {/* Giant ALTERA text - bottom right, perfectly separated from paragraph text */}
        <div className="max-w-[var(--spacing-contentMax)] w-full mx-auto flex justify-end items-end relative z-0 select-none pointer-events-none mt-8 md:mt-0">
          <h2 className="font-heading font-black uppercase tracking-tighter leading-none text-white text-[clamp(4.5rem,12vw,12rem)] text-right translate-y-[4%]">
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
            <h2 className="font-heading text-[clamp(3.5rem,9vw,7.5rem)] tracking-normal leading-none text-[#0011FF] font-black w-full flex flex-col md:flex-row justify-between uppercase">
              <div className="flex gap-4 md:gap-6">
                <span>CÁCH</span>
                <span>ALTERA</span>
              </div>
              <span className="mt-4 md:mt-0">HOẠT ĐỘNG</span>
            </h2>
          </div>

          {/* Staggered Numbered Grid with ProcessCard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 relative w-full h-auto md:h-[600px] mt-12 items-center">
            {/* Step 1 */}
            <div className="md:translate-y-[-60px]">
              <ProcessCard number="01" title={"Khám phá\nPhong cách"} />
            </div>

            {/* Step 2 */}
            <div className="md:translate-y-[60px]">
              <ProcessCard number="02" title={"Thiết kế\nTrang phục"} />
            </div>

            {/* Step 3 */}
            <div className="md:translate-y-[-60px]">
              <ProcessCard number="03" title={"Đặt may\nTheo yêu cầu"} />
            </div>

            {/* Step 4 */}
            <div className="md:translate-y-[60px]">
              <ProcessCard number="04" title={"Chia sẻ\nThiết kế"} />
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — OUR VALUES (GIÁ TRỊ CỐT LÕI)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-gradient-to-b from-[#0011FF] via-[#0055FF] to-[#00C8FF] pt-16 md:pt-20 pb-0 px-6 overflow-hidden relative flex flex-col justify-end min-h-[820px] md:min-h-[920px]">
        {/* Ambient tech glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(56,189,248,0.22),transparent_60%)] z-0" />

        <div className="w-full max-w-7xl mx-auto relative flex flex-col items-center justify-end flex-1">
          {/* Interactive HUD Stage */}
          <div className="relative flex justify-center items-end w-full max-w-[1200px] h-[560px] md:h-[780px] mx-auto">

            {/* SVG HUD Connector Lines & Reticle Boxes (Desktop) */}
            <svg
              className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-30"
              viewBox="0 0 1200 780"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* 1. Top-Left: CÁ NHÂN HÓA */}
              {/* Reticle square on upper-left shoulder */}
              <rect
                x="418"
                y="165"
                width="68"
                height="68"
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="1"
                fill="rgba(255,255,255,0.03)"
              />
              {/* Title baseline extending left from reticle */}
              <line
                x1="280"
                y1="210"
                x2="418"
                y2="210"
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="1"
              />
              {/* HUD angled connector from reticle down-left to description */}
              <polyline
                points="418,233 386,268 175,268"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="1"
              />
              <circle cx="418" cy="210" r="2" fill="#67e8f9" />
              <circle cx="175" cy="268" r="2" fill="rgba(255,255,255,0.9)" />

              {/* 2. Bottom-Left: SÁNG TẠO */}
              {/* Reticle square on lower-left jacket hem */}
              <rect
                x="398"
                y="450"
                width="68"
                height="68"
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="1"
                fill="rgba(255,255,255,0.03)"
              />
              {/* HUD connector from reticle up-left to description */}
              <polyline
                points="398,510 345,510 315,480 140,480"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="1"
              />
              {/* Vertical drop line to title */}
              <line
                x1="398"
                y1="518"
                x2="398"
                y2="545"
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="1"
              />
              <circle cx="398" cy="510" r="2" fill="#67e8f9" />
              <circle cx="140" cy="480" r="2" fill="rgba(255,255,255,0.9)" />

              {/* 3. Top-Right: CÔNG NGHỆ */}
              {/* Reticle square on upper-right shoulder */}
              <rect
                x="696"
                y="138"
                width="68"
                height="68"
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="1"
                fill="rgba(255,255,255,0.03)"
              />
              {/* Title baseline extending right from reticle */}
              <line
                x1="764"
                y1="194"
                x2="885"
                y2="194"
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="1"
              />
              {/* HUD angled connector from reticle down-right to description */}
              <polyline
                points="748,206 780,242 1035,242"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="1"
              />
              <circle cx="764" cy="194" r="2" fill="#67e8f9" />
              <circle cx="1035" cy="242" r="2" fill="rgba(255,255,255,0.9)" />

              {/* 4. Bottom-Right: BỀN VỮNG */}
              {/* Reticle square on lower-right jacket */}
              <rect
                x="638"
                y="402"
                width="68"
                height="68"
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="1"
                fill="rgba(255,255,255,0.03)"
              />
              {/* Title baseline extending right from reticle */}
              <line
                x1="706"
                y1="452"
                x2="835"
                y2="452"
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="1"
              />
              {/* HUD angled connector from reticle down-right to description */}
              <polyline
                points="706,470 738,502 1045,502"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="1"
              />
              <circle cx="706" cy="452" r="2" fill="#67e8f9" />
              <circle cx="1045" cy="502" r="2" fill="rgba(255,255,255,0.9)" />
            </svg>

            {/* ── Floating Tech Typography Callouts (Desktop) ── */}
            <div className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-30">
              {/* 1. Top-Left: CÁ NHÂN HÓA */}
              <div
                className="absolute text-right"
                style={{ left: '21.5%', top: '23.8%', width: '190px' }}
              >
                <span className="font-heading font-semibold text-xs lg:text-sm uppercase tracking-normal text-white block">
                  CÁ NHÂN HÓA
                </span>
              </div>
              <div
                className="absolute text-right"
                style={{ left: '11.5%', top: '35.5%', width: '235px' }}
              >
                <p className="text-white/90 font-light tracking-normal text-[11px] lg:text-xs leading-relaxed">
                  Mỗi thiết kế đều phản ánh cá tính và phong cách độc bản của người mặc
                </p>
              </div>

              {/* 2. Bottom-Left: SÁNG TẠO */}
              <div
                className="absolute text-right"
                style={{ left: '9.5%', top: '55.5%', width: '220px' }}
              >
                <p className="text-white/90 font-light tracking-normal text-[11px] lg:text-xs leading-relaxed">
                  Khuyến khích mọi người tự do thể hiện ý tưởng độc đáo không giới hạn
                </p>
              </div>
              <div
                className="absolute text-right"
                style={{ left: '21.5%', top: '67.5%', width: '175px' }}
              >
                <span className="font-heading font-semibold text-xs lg:text-sm uppercase tracking-normal text-white block">
                  SÁNG TẠO
                </span>
              </div>

              {/* 3. Top-Right: CÔNG NGHỆ */}
              <div
                className="absolute text-left"
                style={{ left: '64.5%', top: '21.8%', width: '180px' }}
              >
                <span className="font-heading font-semibold text-xs lg:text-sm uppercase tracking-normal text-white block">
                  CÔNG NGHỆ
                </span>
              </div>
              <div
                className="absolute text-left"
                style={{ left: '66.5%', top: '32%', width: '235px' }}
              >
                <p className="text-white/90 font-light tracking-normal text-[11px] lg:text-xs leading-relaxed">
                  Ứng dụng AI đột phá giúp đơn giản hóa quy trình tìm kiếm và thiết kế thời trang
                </p>
              </div>

              {/* 4. Bottom-Right: BỀN VỮNG */}
              <div
                className="absolute text-left"
                style={{ left: '59.8%', top: '54.8%', width: '180px' }}
              >
                <span className="font-heading font-semibold text-xs lg:text-sm uppercase tracking-normal text-white block">
                  BỀN VỮNG
                </span>
              </div>
              <div
                className="absolute text-left"
                style={{ left: '62.5%', top: '65.5%', width: '245px' }}
              >
                <p className="text-white/90 font-light tracking-normal text-[11px] lg:text-xs leading-relaxed">
                  Ưu tiên sản xuất theo yêu cầu thực tế, giảm thiểu tối đa tồn kho và bảo vệ môi trường
                </p>
              </div>
            </div>

            {/* Centerpiece Jacket & Rock Pedestal (z-20 sits IN FRONT of bottom watermark) */}
            <img
              src={about2}
              alt="Giá trị cốt lõi ALTERA"
              className="h-[88%] md:h-[96%] w-auto object-contain object-bottom relative z-20 drop-shadow-[0_28px_50px_rgba(0,0,0,0.45)] select-none"
            />
          </div>

          {/* Mobile Responsive Floating Callouts */}
          <div className="grid grid-cols-2 gap-6 w-full max-w-lg mx-auto pb-16 md:hidden relative z-30">
            <div className="border-t border-white/40 pt-3">
              <span className="font-heading font-semibold text-xs uppercase tracking-normal text-white block mb-1">
                CÁ NHÂN HÓA
              </span>
              <p className="text-white/85 font-light text-xs leading-relaxed">
                Mỗi thiết kế đều phản ánh cá tính và phong cách độc bản của người mặc
              </p>
            </div>
            <div className="border-t border-white/40 pt-3">
              <span className="font-heading font-semibold text-xs uppercase tracking-normal text-white block mb-1">
                CÔNG NGHỆ
              </span>
              <p className="text-white/85 font-light text-xs leading-relaxed">
                Ứng dụng AI đột phá giúp đơn giản hóa quy trình tìm kiếm và thiết kế thời trang
              </p>
            </div>
            <div className="border-t border-white/40 pt-3">
              <span className="font-heading font-semibold text-xs uppercase tracking-normal text-white block mb-1">
                SÁNG TẠO
              </span>
              <p className="text-white/85 font-light text-xs leading-relaxed">
                Khuyến khích mọi người tự do thể hiện ý tưởng độc đáo không giới hạn
              </p>
            </div>
            <div className="border-t border-white/40 pt-3">
              <span className="font-heading font-semibold text-xs uppercase tracking-normal text-white block mb-1">
                BỀN VỮNG
              </span>
              <p className="text-white/85 font-light text-xs leading-relaxed">
                Ưu tiên sản xuất theo yêu cầu thực tế, giảm thiểu tối đa tồn kho và bảo vệ môi trường
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Watermark "GIÁ TRỊ CỐT LÕI" — sits at the very bottom behind the rock pedestal (z-10) */}
        <h2 className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full text-center font-heading font-black text-[clamp(3.2rem,10.2vw,9.6rem)] whitespace-nowrap tracking-normal leading-[0.82] text-white/20 z-10 pointer-events-none select-none pb-1 md:pb-2">
          GIÁ TRỊ CỐT LÕI
        </h2>
      </section>

    </div>
  )
}
