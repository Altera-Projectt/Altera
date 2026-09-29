import { Link } from 'react-router-dom'
import { Camera, Video, Music } from 'lucide-react'
import { cn } from '@/utils/cn'
import logoSvg from '@/assets/logo1.png'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("bg-white py-16 md:py-24 font-body border-t border-gray-200", className)}>
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">

          {/* ── Column 1: Brand & Newsletter ── */}
          <div className="lg:col-span-2 pr-0 md:pr-12">
            <Link to="/" className="inline-block mb-10">
              <img src={logoSvg} alt="ALTERA Logo" className="h-12 md:h-16 w-auto object-contain" />
            </Link>

            <form className="mb-4 max-w-[240px]" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-transparent text-[10px] font-bold text-black placeholder:text-black mb-3 outline-none"
              />
              <Link to="/membership" className="w-full bg-gradient-brand text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-sm hover:opacity-90 transition-opacity flex justify-center items-center">
                SUBSCRIBE
              </Link>
            </form>
            <p className="text-[10px] leading-relaxed text-black max-w-[200px]">
              By signing up, you agree to our <br />
              Privacy Policy.
            </p>
          </div>

          {/* ── Column 2: NAVIGATE ── */}
          <div className="flex flex-col">
            <h3 className="heading-brand text-base md:text-lg text-black mb-6">NAVIGATE</h3>
            <ul className="flex flex-col gap-3">
              {['Search', 'About Us', 'Membership Policy', 'Invoice on Request', 'Contact Us', 'Terms of Service'].map(link => (
                <li key={link}>
                  <Link to="#" className="text-[11px] md:text-xs text-black hover:text-electric-blue transition-colors tracking-tight font-medium">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: SOCIAL ── */}
          <div className="flex flex-col">
            <h3 className="heading-brand text-base md:text-lg text-black mb-6">SOCIAL</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="#" className="text-[11px] md:text-xs text-black hover:text-electric-blue transition-colors flex items-center gap-2 tracking-tight font-medium">
                  <Camera className="h-3.5 w-3.5" strokeWidth={2.5} /> Instagram
                </a>
              </li>
              <li>
                <a href="#" className="text-[11px] md:text-xs text-black hover:text-electric-blue transition-colors flex items-center gap-2 tracking-tight font-medium">
                  <Video className="h-3.5 w-3.5" strokeWidth={2.5} /> Youtube
                </a>
              </li>
              <li>
                <a href="#" className="text-[11px] md:text-xs text-black hover:text-electric-blue transition-colors flex items-center gap-2 tracking-tight font-medium">
                  <Music className="h-3.5 w-3.5" strokeWidth={2.5} /> TikTok
                </a>
              </li>
            </ul>
          </div>

          {/* ── Column 4: OFFICIAL ── */}
          <div className="flex flex-col">
            <h3 className="heading-brand text-base md:text-lg text-black mb-6">OFFICIAL</h3>
            <ul className="flex flex-col gap-3">
              {['Membership Policy', 'Return & Exchange Policy', 'Shipping Policy', 'Inspection Policy', 'Privacy Policy', 'Payment Policy'].map(link => (
                <li key={link}>
                  <Link to="#" className="text-[11px] md:text-xs text-black hover:text-electric-blue transition-colors tracking-tight font-medium">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 5: SUPPORT ── */}
          <div className="flex flex-col">
            <h3 className="heading-brand text-base md:text-lg text-black mb-6">SUPPORT</h3>
            <div className="text-[11px] md:text-xs text-black leading-loose mb-12 tracking-tight font-medium">
              We're here Mon-Sun <br />
              10:00am - 9:30pm GMT+7. <br />
              Drop us a note anytime.
            </div>

            <p className="text-[11px] md:text-xs text-black mt-auto tracking-tight font-medium">
              © Copyright ALTERA 2026
            </p>
          </div>

        </div>
      </div>
    </footer>
  )
}
