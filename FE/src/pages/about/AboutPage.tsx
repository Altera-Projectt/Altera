import { Link } from 'react-router-dom'
import { ArrowRight, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'

// ── Core Values Data ───────────────────────────────────────────────────────

const coreValues = [
  {
    title: 'Design Studio',
    description:
      'A smart fashion design tool that allows you to customize every detail — from shape and color to pattern — according to your unique style.',
    accent: '#000000',
  },
  {
    title: 'AI Stylist',
    description:
      'An AI-integrated style assistant that understands your aesthetic and recommends outfits suited for your body type, occasions, and modern fashion trends.',
    accent: '#e11d48',
  },
  {
    title: 'Community',
    description:
      'Join a community of fashion lovers, share designs, get inspired by each other, and shape the trends of tomorrow.',
    accent: '#6366f1',
  },
]

// ── Component ──────────────────────────────────────────────────────────────

export function AboutPage() {
  return (
    <div className="min-h-[80vh]">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black text-white">
        {/* Background image */}
        <img
          src="/about1.jpg"
          alt="About ALTERA"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-50"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-[var(--spacing-contentMax)] px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm font-medium mb-6 backdrop-blur-sm border border-white/10">
              <Globe className="h-4 w-4" />
              AI Fashion Brand — Made in Vietnam
            </div>
            <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-6">
              About <br />
              <span className="relative">
                ALTERA
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-[var(--color-accent)] rounded-full" />
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 leading-relaxed max-w-2xl">
              We believe everyone has their own unique style — and AI technology can help you discover, express, and develop it most naturally.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" variant="secondary" className="uppercase font-semibold tracking-wider">
                <Link to="/products">Explore Collection</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 uppercase font-semibold tracking-wider">
                <Link to="/outfit">Try AI Stylist</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-4">
              <span className="h-px w-8 bg-[var(--color-border)]" />
              Brand Story
            </div>
            <h2 className="font-heading text-4xl font-bold mb-6">
              Fashion <br /> Without Limits
            </h2>
            <div className="space-y-4 text-[var(--color-muted-foreground)] leading-relaxed">
              <p>
                ALTERA was born from a simple idea: <strong className="text-[var(--color-foreground)]">fashion should reflect you, not the other way around.</strong> In a world full of trends, we want to create a platform where every individual can freely express themselves.
              </p>
              <p>
                By combining advanced AI technology with modern fashion thinking, ALTERA provides you with the tools to discover, customize, and own your unique style — from intelligent outfit recommendations to a unique 3D design studio.
              </p>
              <p>
                We don't just sell clothes. We build a community where style is shared, inspired, and celebrated.
              </p>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="aspect-square w-full rounded-[var(--radius-2xl)] overflow-hidden bg-[var(--color-muted)]">
              <img
                src="/about2.jpg"
                alt="AI x Fashion"
                className="w-full h-full object-cover"
              />
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
              Core Values
              <span className="h-px w-8 bg-[var(--color-border)]" />
            </div>
            <h2 className="font-heading text-4xl font-bold">Three Pillars of ALTERA</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreValues.map((value) => (
              <div
                key={value.title}
                className="bg-[var(--color-background)] rounded-[var(--radius-xl)] p-8 border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <h3 className="font-heading text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <blockquote className="font-heading text-3xl md:text-4xl font-bold leading-tight mb-6">
            "We believe everyone has their own unique style — ALTERA is here to help you find it."
          </blockquote>
          <p className="text-[var(--color-muted-foreground)] mb-10 text-lg">
            — ALTERA Team
          </p>
          <Button asChild size="xl" className="uppercase font-semibold tracking-wider">
            <Link to="/membership">
              Join ALTERA Community
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

    </div>
  )
}
