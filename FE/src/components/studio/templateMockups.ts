import type { DesignTemplate } from '@/services/design.api'

/**
 * High-fidelity 3D Streetwear T-Shirt Vector Mockup Generator
 * Renders an oversized crewneck t-shirt floating in an ALTERA Dark Navy 3D studio,
 * with fabric volume shading, neck ribbing, creases, ground shadow, and unique style artwork.
 */
function build3DShirtSvg(
  id: string,
  spotlight1: string,
  spotlight2: string,
  artworkSvg: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 460" width="360" height="460">
  <defs>
    <!-- Background Radial Spotlight -->
    <radialGradient id="bgGrad_${id}" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="${spotlight1}" stop-opacity="0.24"/>
      <stop offset="45%" stop-color="${spotlight2}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#060B16" stop-opacity="0"/>
    </radialGradient>

    <!-- Shirt Base Fabric Gradient (Dark Navy 3D) -->
    <linearGradient id="fabricBase_${id}" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#1f293d"/>
      <stop offset="35%" stop-color="#141c2c"/>
      <stop offset="70%" stop-color="#0d1421"/>
      <stop offset="100%" stop-color="#070c15"/>
    </linearGradient>

    <!-- Shoulder & Chest Specular Volume Light -->
    <radialGradient id="chestLight_${id}" cx="50%" cy="30%" r="52%">
      <stop offset="0%" stop-color="${spotlight1}" stop-opacity="0.14"/>
      <stop offset="55%" stop-color="#1e293b" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Collar Rim Gradient -->
    <linearGradient id="collarGrad_${id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <!-- Shadow Blur -->
    <filter id="shadowBlur_${id}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
  </defs>

  <!-- Container Box -->
  <rect width="360" height="460" rx="16" fill="#060B16"/>
  <rect width="360" height="460" rx="16" fill="url(#bgGrad_${id})"/>
  
  <!-- Subtle Studio Technical Grid & Lines -->
  <g opacity="0.07" stroke="${spotlight1}" stroke-width="1">
    <line x1="24" y1="0" x2="24" y2="460"/>
    <line x1="336" y1="0" x2="336" y2="460"/>
    <line x1="0" y1="416" x2="360" y2="416"/>
    <circle cx="24" cy="416" r="3" fill="${spotlight1}"/>
    <circle cx="336" cy="416" r="3" fill="${spotlight1}"/>
  </g>

  <!-- Floating Ground Shadow -->
  <ellipse cx="180" cy="428" rx="85" ry="12" fill="#000000" opacity="0.65" filter="url(#shadowBlur_${id})"/>
  <ellipse cx="180" cy="428" rx="55" ry="6" fill="${spotlight1}" opacity="0.16" filter="url(#shadowBlur_${id})"/>

  <!-- T-Shirt Silhouette Group -->
  <g id="shirt-model_${id}">
    <!-- Main Shirt Body & Sleeves -->
    <path d="M 132 68 
             C 145 64, 215 64, 228 68 
             L 282 86 
             L 338 142 
             C 342 146, 345 153, 342 158 
             L 314 195 
             C 310 200, 303 201, 298 197 
             L 272 176 
             L 272 380 
             C 272 388, 266 394, 258 395 
             C 210 398, 150 398, 102 395 
             C 94 394, 88 388, 88 380 
             L 88 176 
             L 62 197 
             C 57 201, 50 200, 46 195 
             L 18 158 
             C 15 153, 18 146, 22 142 
             L 78 86 Z" 
          fill="url(#fabricBase_${id})" 
          stroke="#232f46" 
          stroke-width="1.5"
    />

    <!-- 3D Chest Volume Light Overlay -->
    <path d="M 132 68 
             C 145 64, 215 64, 228 68 
             L 282 86 
             L 338 142 
             L 314 195 
             L 272 176 
             L 272 380 
             C 210 398, 150 398, 88 380 
             L 88 176 
             L 62 197 
             L 18 158 
             L 78 86 Z" 
          fill="url(#chestLight_${id})" 
          opacity="0.9"
    />

    <!-- Left & Right Underarm Crease Shading -->
    <path d="M 88 176 C 96 210, 105 240, 94 285" fill="none" stroke="#050912" stroke-width="3" opacity="0.45" stroke-linecap="round"/>
    <path d="M 91 180 C 100 215, 108 245, 97 285" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.12" stroke-linecap="round"/>
    
    <path d="M 272 176 C 264 210, 255 240, 266 285" fill="none" stroke="#050912" stroke-width="3" opacity="0.45" stroke-linecap="round"/>
    <path d="M 269 180 C 261 215, 252 245, 263 285" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.12" stroke-linecap="round"/>

    <!-- Left Sleeve Seam -->
    <path d="M 78 86 C 84 115, 86 148, 88 176" fill="none" stroke="#070c16" stroke-width="2.5" opacity="0.6"/>
    <path d="M 80 88 C 86 116, 88 149, 90 176" fill="none" stroke="#475569" stroke-width="1" opacity="0.2"/>

    <!-- Right Sleeve Seam -->
    <path d="M 282 86 C 276 115, 274 148, 272 176" fill="none" stroke="#070c16" stroke-width="2.5" opacity="0.6"/>
    <path d="M 280 88 C 274 116, 272 149, 270 176" fill="none" stroke="#475569" stroke-width="1" opacity="0.2"/>

    <!-- Sleeve Cuffs -->
    <path d="M 22 144 L 48 196" fill="none" stroke="#070c16" stroke-width="2" opacity="0.4"/>
    <path d="M 338 144 L 312 196" fill="none" stroke="#070c16" stroke-width="2" opacity="0.4"/>

    <!-- Inside Back Neck Depth -->
    <path d="M 132 68 C 145 82, 215 82, 228 68 C 218 58, 142 58, 132 68 Z" fill="#070b13" stroke="#172033" stroke-width="1"/>

    <!-- Front Rib Collar Band -->
    <path d="M 132 68 C 145 98, 215 98, 228 68 C 220 74, 140 74, 132 68 Z" fill="url(#collarGrad_${id})" stroke="${spotlight1}" stroke-width="1" stroke-opacity="0.3"/>
    <!-- Collar Stitching -->
    <path d="M 136 71 C 148 94, 212 94, 224 71" fill="none" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.7"/>

    <!-- Bottom Hem Seam -->
    <path d="M 89 385 C 140 390, 220 390, 271 385" fill="none" stroke="#070c16" stroke-width="2" opacity="0.6"/>
    <path d="M 89 387 C 140 392, 220 392, 271 387" fill="none" stroke="#334155" stroke-width="1" stroke-dasharray="4,2" opacity="0.4"/>
  </g>

  <!-- PRINT ARTWORK (Style Specific) -->
  <g id="print-artwork_${id}" transform="translate(180, 225)">
    ${artworkSvg}
  </g>
</svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * 8 Dedicated Style Artworks matching the ALTERA Brutalist Dark Navy Standard
 */
export const TEMPLATE_MOCKUPS: Record<string, string> = {
  // 1. Abstract Motion: 3D neon ribbon waves in Cyan, Blue, Violet
  'abstract-motion': build3DShirtSvg(
    'abstract_motion',
    '#00f0ff',
    '#3b82f6',
    `
      <defs>
        <linearGradient id="absWave1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f0ff"/>
          <stop offset="50%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
        <linearGradient id="absWave2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#06b6d4"/>
        </linearGradient>
      </defs>
      <path d="M -55 -25 C -30 -60, 30 10, 55 -20 C 35 30, -25 35, -55 -25 Z" fill="url(#absWave1)" opacity="0.85"/>
      <path d="M -45 10 C -15 -20, 25 35, 50 15 C 30 50, -20 40, -45 10 Z" fill="url(#absWave2)" opacity="0.75"/>
      <path d="M -50 -10 C -20 -40, 20 20, 50 -10" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.9"/>
      <path d="M -40 25 C -10 -5, 20 45, 45 30" fill="none" stroke="#00f0ff" stroke-width="1" stroke-dasharray="3,2" opacity="0.8"/>
      <text x="0" y="55" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="8" font-weight="900" letter-spacing="3" fill="#ffffff">ABSTRACT MOTION</text>
      <text x="0" y="65" text-anchor="middle" font-family="Arial, sans-serif" font-size="4.5" font-weight="600" letter-spacing="1.5" fill="#38bdf8" opacity="0.85">KINETIC SERIES // 2026</text>
    `
  ),

  // 2. Manga Panel: Slanted Japanese comic panels, speedlines, red stamp, kanji
  'manga-panel': build3DShirtSvg(
    'manga_panel',
    '#ef4444',
    '#ffffff',
    `
      <g>
        <polygon points="-52,-50 48,-50 56,15 -44,15" fill="#0b0f19" stroke="#ffffff" stroke-width="1.8"/>
        <g stroke="#ffffff" stroke-width="1" opacity="0.35">
          <line x1="-50" y1="-45" x2="40" y2="10"/>
          <line x1="-45" y1="-50" x2="45" y2="5"/>
          <line x1="-35" y1="-50" x2="50" y2="0"/>
          <line x1="-25" y1="-50" x2="52" y2="-10"/>
          <line x1="-15" y1="-50" x2="54" y2="-20"/>
          <line x1="-5" y1="-50" x2="55" y2="-30"/>
        </g>
        <text x="0" y="-12" text-anchor="middle" font-family="Impact, sans-serif" font-size="30" font-weight="900" fill="#ffffff" letter-spacing="2">超越</text>
        <circle cx="34" cy="-32" r="10" fill="#ef4444"/>
        <text x="34" y="-28" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#ffffff">章</text>
        <polygon points="-42,20 54,20 50,38 -46,38" fill="#ef4444" stroke="#ffffff" stroke-width="1.2"/>
        <text x="4" y="32" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="7" font-weight="900" letter-spacing="2" fill="#ffffff">MANGA // VOL. 01</text>
        <text x="0" y="58" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="5" font-weight="700" letter-spacing="3" fill="#ffffff">STORY IN MOTION</text>
      </g>
    `
  ),

  // 3. Graphic Orbit: Celestial planet, orbital rings, starfield, space coordinates
  'graphic-orbit': build3DShirtSvg(
    'graphic_orbit',
    '#38bdf8',
    '#6366f1',
    `
      <defs>
        <linearGradient id="planetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="45%" stop-color="#1d4ed8"/>
          <stop offset="100%" stop-color="#090d16"/>
        </linearGradient>
      </defs>
      <circle cx="-45" cy="-35" r="1.5" fill="#38bdf8"/>
      <circle cx="48" cy="-25" r="1" fill="#ffffff"/>
      <circle cx="-38" cy="25" r="1.2" fill="#ffffff"/>
      <circle cx="40" cy="35" r="1.5" fill="#38bdf8"/>
      <circle cx="0" cy="-5" r="26" fill="url(#planetGrad)" stroke="#38bdf8" stroke-width="0.8"/>
      <path d="M -56 -10 C -56 -24, 56 10, 56 0" fill="none" stroke="#60a5fa" stroke-width="3" opacity="0.4"/>
      <path d="M 56 0 C 56 14, -56 -5, -56 -10" fill="none" stroke="#38bdf8" stroke-width="3.5"/>
      <circle cx="36" cy="6" r="3.5" fill="#ffffff" stroke="#00f0ff" stroke-width="1"/>
      <circle cx="-42" cy="-9" r="2" fill="#a78bfa"/>
      <ellipse cx="0" cy="-5" rx="52" ry="16" fill="none" stroke="#38bdf8" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.7" transform="rotate(-15)"/>
      <text x="0" y="48" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="8" font-weight="900" letter-spacing="3" fill="#ffffff">GRAPHIC ORBIT</text>
      <text x="0" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-size="4.5" font-weight="600" letter-spacing="2" fill="#38bdf8">DEEP SPACE HORIZON // 2026</text>
    `
  ),

  // 4. Minimal Form: Bauhaus geometric harmony, thin intersecting lines, balanced discs
  'minimal-form': build3DShirtSvg(
    'minimal_form',
    '#f8fafc',
    '#64748b',
    `
      <circle cx="0" cy="-10" r="36" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
      <circle cx="-12" cy="-18" r="18" fill="#f8fafc" opacity="0.95"/>
      <circle cx="16" cy="2" r="14" fill="none" stroke="#00f0ff" stroke-width="2"/>
      <line x1="-48" y1="-10" x2="48" y2="-10" stroke="#ffffff" stroke-width="0.8" opacity="0.5"/>
      <line x1="0" y1="-50" x2="0" y2="35" stroke="#ffffff" stroke-width="0.8" opacity="0.5"/>
      <rect x="18" y="-36" width="6" height="6" fill="#f43f5e"/>
      <text x="0" y="52" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="8" font-weight="800" letter-spacing="4" fill="#ffffff">MINIMAL FORM</text>
      <text x="0" y="62" text-anchor="middle" font-family="Arial, sans-serif" font-size="4.5" font-weight="500" letter-spacing="2" fill="#94a3b8">LESS, BUT BETTER // 01</text>
    `
  ),

  // 5. City Runner / RUN CLUB: Athletic streetwear crest, curved running track lanes, speed badge
  'city-runner': build3DShirtSvg(
    'city_runner',
    '#10b981',
    '#84cc16',
    `
      <defs>
        <linearGradient id="runGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="100%" stop-color="#a3e635"/>
        </linearGradient>
      </defs>
      <circle cx="0" cy="-8" r="34" fill="#091410" stroke="url(#runGrad)" stroke-width="2"/>
      <circle cx="0" cy="-8" r="30" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
      <path d="M -22 -8 C -10 -22, 10 -22, 22 -8 C 10 2, -10 2, -22 -8 Z" fill="url(#runGrad)"/>
      <path d="M -18 2 C -8 -8, 8 -8, 18 2" fill="none" stroke="#ffffff" stroke-width="1.5"/>
      <path d="M -14 9 C -6 2, 6 2, 14 9" fill="none" stroke="#a3e635" stroke-width="1.2"/>
      <text x="0" y="-12" text-anchor="middle" font-family="Impact, sans-serif" font-size="11" font-weight="900" letter-spacing="1" fill="#ffffff">RUN</text>
      <text x="0" y="0" text-anchor="middle" font-family="Impact, sans-serif" font-size="11" font-weight="900" letter-spacing="1" fill="#ffffff">CLUB</text>
      <text x="0" y="46" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="8" font-weight="900" letter-spacing="2.5" fill="#ffffff">CITY RUNNER</text>
      <text x="0" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="4.5" font-weight="700" letter-spacing="2" fill="#34d399">ALL WEATHER ATHLETICS // 2024</text>
    `
  ),

  // 6. Block Party / BLOCK: Deconstructed brutalist color blocks in cobalt, coral, acid yellow
  'block-party': build3DShirtSvg(
    'block_party',
    '#ef4444',
    '#3b82f6',
    `
      <g>
        <rect x="-42" y="-45" width="46" height="42" fill="#2563eb" opacity="0.95"/>
        <rect x="-10" y="-25" width="52" height="46" fill="#f43f5e" opacity="0.95"/>
        <rect x="18" y="-48" width="24" height="28" fill="#eab308" opacity="0.9"/>
        <line x1="-38" y1="-2" x2="38" y2="-2" stroke="#ffffff" stroke-width="2"/>
        <text x="-2" y="-14" text-anchor="middle" font-family="Impact, sans-serif" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="2">BLOCK</text>
        <text x="-2" y="14" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="12" font-weight="900" fill="#0f172a" letter-spacing="4">PARTY</text>
        <text x="0" y="50" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="7" font-weight="900" letter-spacing="3" fill="#ffffff">COLOR BLOCK</text>
        <text x="0" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="4.5" font-weight="600" letter-spacing="1.5" fill="#f87171">COLLISION // COMPOSITION</text>
      </g>
    `
  ),

  // 7. Type Study / TYPE 01: Multi-layered editorial typography poster with barcode and orange accent
  'type-study': build3DShirtSvg(
    'type_study',
    '#f59e0b',
    '#ffffff',
    `
      <g>
        <text x="-5" y="-12" text-anchor="middle" font-family="Impact, sans-serif" font-size="44" font-weight="900" fill="none" stroke="#475569" stroke-width="1.5" letter-spacing="2">TYPE</text>
        <text x="24" y="16" text-anchor="middle" font-family="Impact, sans-serif" font-size="40" font-weight="900" fill="#f97316">01</text>
        <rect x="-44" y="-42" width="2" height="65" fill="#ffffff" opacity="0.4"/>
        <text x="-38" y="-35" font-family="Courier, monospace" font-size="5" fill="#94a3b8">GRID: 12-COL</text>
        <text x="-38" y="-27" font-family="Courier, monospace" font-size="5" fill="#94a3b8">SPECIMEN</text>
        <text x="-38" y="-19" font-family="Courier, monospace" font-size="5" fill="#f97316">OPTICAL</text>
        <g fill="#ffffff" opacity="0.8">
          <rect x="-42" y="26" width="2" height="10"/>
          <rect x="-38" y="26" width="3" height="10"/>
          <rect x="-33" y="26" width="1" height="10"/>
          <rect x="-30" y="26" width="4" height="10"/>
          <rect x="-24" y="26" width="2" height="10"/>
          <rect x="-20" y="26" width="3" height="10"/>
        </g>
        <text x="0" y="52" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="7.5" font-weight="900" letter-spacing="3" fill="#ffffff">TYPE STUDY // 01</text>
        <text x="0" y="62" text-anchor="middle" font-family="Arial, sans-serif" font-size="4.5" font-weight="600" letter-spacing="1.5" fill="#fbbf24">LETTERFORM SERIES 2026</text>
      </g>
    `
  ),

  // 8. Retro Sunset / SUNSET: Synthwave sun with horizontal perspective blinds & retro grid
  'retro-sunset': build3DShirtSvg(
    'retro_sunset',
    '#ec4899',
    '#f97316',
    `
      <defs>
        <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fde047"/>
          <stop offset="40%" stop-color="#fb923c"/>
          <stop offset="70%" stop-color="#ec4899"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
      </defs>
      <g>
        <circle cx="0" cy="-12" r="32" fill="url(#sunGrad)"/>
        <rect x="-34" y="-8" width="68" height="1.8" fill="#0c121e"/>
        <rect x="-34" y="-3" width="68" height="2.5" fill="#0c121e"/>
        <rect x="-34" y="3" width="68" height="3.2" fill="#0c121e"/>
        <rect x="-34" y="10" width="68" height="4" fill="#0c121e"/>
        <g stroke="#ec4899" stroke-width="0.8" opacity="0.6">
          <line x1="-50" y1="20" x2="50" y2="20"/>
          <line x1="-52" y1="27" x2="52" y2="27"/>
          <line x1="-54" y1="36" x2="54" y2="36"/>
          <line x1="0" y1="18" x2="0" y2="38"/>
          <line x1="0" y1="18" x2="-22" y2="38"/>
          <line x1="0" y1="18" x2="22" y2="38"/>
          <line x1="0" y1="18" x2="-45" y2="38"/>
          <line x1="0" y1="18" x2="45" y2="38"/>
        </g>
        <text x="0" y="52" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="8" font-weight="900" letter-spacing="3" fill="#ffffff">RETRO SUNSET</text>
        <text x="0" y="62" text-anchor="middle" font-family="Arial, sans-serif" font-size="4.5" font-weight="700" letter-spacing="2" fill="#fb923c">SYNTHWAVE // CALIFORNIA 1984</text>
      </g>
    `
  )
}

/**
 * Normalizes template thumbnail to 3D Dark Navy vector SVG if matching built-in style
 */
export function getTemplateThumbnail(template: { slug?: string; name?: string; thumbnail?: string }): string {
  if (template.slug && TEMPLATE_MOCKUPS[template.slug]) {
    return TEMPLATE_MOCKUPS[template.slug]
  }

  // Check by name fuzzy matching
  const lowerName = (template.name || '').toLowerCase()
  if (lowerName.includes('abstract')) return TEMPLATE_MOCKUPS['abstract-motion']
  if (lowerName.includes('manga')) return TEMPLATE_MOCKUPS['manga-panel']
  if (lowerName.includes('orbit')) return TEMPLATE_MOCKUPS['graphic-orbit']
  if (lowerName.includes('minimal')) return TEMPLATE_MOCKUPS['minimal-form']
  if (lowerName.includes('runner') || lowerName.includes('run')) return TEMPLATE_MOCKUPS['city-runner']
  if (lowerName.includes('block')) return TEMPLATE_MOCKUPS['block-party']
  if (lowerName.includes('type')) return TEMPLATE_MOCKUPS['type-study']
  if (lowerName.includes('sunset')) return TEMPLATE_MOCKUPS['retro-sunset']

  // If thumbnail has legacy cream 2D svg, fallback to abstract-motion
  if (template.thumbnail && template.thumbnail.includes('f4f1eb')) {
    return TEMPLATE_MOCKUPS['abstract-motion']
  }

  return template.thumbnail || TEMPLATE_MOCKUPS['abstract-motion']
}

/**
 * Built-in Preset Templates as immediate fallback & full client readiness
 */
export const BUILTIN_PRESET_TEMPLATES: DesignTemplate[] = [
  {
    _id: 'preset-abstract-motion',
    slug: 'abstract-motion',
    name: 'Abstract Motion',
    category: 'Abstract',
    style: 'Graphic',
    tags: ['abstract', 'motion', 'art', 'neon'],
    description: 'Đồ họa các dải sóng lượn trừu tượng 3D màu Neon Cyan/Blue chuyển động mạnh mẽ.',
    thumbnail: TEMPLATE_MOCKUPS['abstract-motion'],
    frontDesign: {
      layers: [
        {
          id: 'abs-motion-shadow',
          type: 'text',
          name: 'Move shadow',
          visible: true,
          locked: false,
          zIndex: 1,
          text: 'MOVE',
          fontFamily: 'Montserrat',
          fontSize: 32,
          fontWeight: 700,
          italic: false,
          underline: false,
          textTransform: 'uppercase',
          align: 'center',
          color: '#ba452e',
          stroke: '#ffffff',
          strokeWidth: 0,
          opacity: 1,
          x: 47,
          y: 49,
          rotation: -8,
          scaleX: 1,
          scaleY: 1,
          effect: 'Straight'
        },
        {
          id: 'abs-motion-title',
          type: 'text',
          name: 'Move',
          visible: true,
          locked: false,
          zIndex: 2,
          text: 'MOVE',
          fontFamily: 'Montserrat',
          fontSize: 28,
          fontWeight: 700,
          italic: false,
          underline: false,
          textTransform: 'uppercase',
          align: 'center',
          color: '#00f0ff',
          stroke: '#ffffff',
          strokeWidth: 0,
          opacity: 1,
          x: 51,
          y: 46,
          rotation: -8,
          scaleX: 1,
          scaleY: 1,
          effect: 'Straight'
        }
      ]
    },
    backDesign: { layers: [] },
    isActive: true,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'preset-manga-panel',
    slug: 'manga-panel',
    name: 'Manga Panel',
    category: 'Anime',
    style: 'Graphic',
    tags: ['anime', 'manga', 'comic', 'halftone'],
    description: 'Bố cục khung tranh Manga Nhật Bản chia ô chéo, họa tiết speedlines trắng đen cá tính kèm điểm nhấn đỏ.',
    thumbnail: TEMPLATE_MOCKUPS['manga-panel'],
    frontDesign: {
      layers: [
        {
          id: 'manga-title',
          type: 'text',
          name: 'Manga',
          visible: true,
          locked: false,
          zIndex: 1,
          text: 'MANGA',
          fontFamily: 'Montserrat',
          fontSize: 34,
          fontWeight: 900,
          italic: false,
          underline: false,
          textTransform: 'uppercase',
          align: 'center',
          color: '#ffffff',
          stroke: '#ffffff',
          strokeWidth: 0,
          opacity: 1,
          x: 50,
          y: 47,
          rotation: -4,
          scaleX: 1,
          scaleY: 1,
          effect: 'Straight'
        }
      ]
    },
    backDesign: { layers: [] },
    isActive: true,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'preset-graphic-orbit',
    slug: 'graphic-orbit',
    name: 'Graphic Orbit',
    category: 'Graphic',
    style: 'Abstract',
    tags: ['graphic', 'orbit', 'space', 'sci-fi'],
    description: 'Hình ảnh hành tinh, quỹ đạo elip bao quanh, ngôi sao và lưới vũ trụ sci-fi hiện đại.',
    thumbnail: TEMPLATE_MOCKUPS['graphic-orbit'],
    frontDesign: {
      layers: [
        {
          id: 'orbit-title',
          type: 'text',
          name: 'Orbit',
          visible: true,
          locked: false,
          zIndex: 1,
          text: 'ORBIT',
          fontFamily: 'Montserrat',
          fontSize: 28,
          fontWeight: 700,
          italic: false,
          underline: false,
          textTransform: 'uppercase',
          align: 'center',
          color: '#38bdf8',
          stroke: '#ffffff',
          strokeWidth: 0,
          opacity: 1,
          x: 50,
          y: 47,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          effect: 'Straight'
        }
      ]
    },
    backDesign: { layers: [] },
    isActive: true,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'preset-minimal-form',
    slug: 'minimal-form',
    name: 'Minimal Form',
    category: 'Minimal',
    style: 'Minimal',
    tags: ['clean', 'typography', 'bauhaus', 'essential'],
    description: 'Bố cục hình học tối giản (vòng tròn, đường cắt mảnh tinh tế kiểu Bauhaus hiện đại).',
    thumbnail: TEMPLATE_MOCKUPS['minimal-form'],
    frontDesign: {
      layers: [
        {
          id: 'form-title',
          type: 'text',
          name: 'Form',
          visible: true,
          locked: false,
          zIndex: 1,
          text: 'FORM',
          fontFamily: 'Montserrat',
          fontSize: 32,
          fontWeight: 700,
          italic: false,
          underline: false,
          textTransform: 'uppercase',
          align: 'center',
          color: '#ffffff',
          stroke: '#ffffff',
          strokeWidth: 0,
          opacity: 1,
          x: 50,
          y: 47,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          effect: 'Straight'
        }
      ]
    },
    backDesign: { layers: [] },
    isActive: true,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'preset-city-runner',
    slug: 'city-runner',
    name: 'City Runner (Run Club)',
    category: 'Sport',
    style: 'Streetwear',
    tags: ['sport', 'running', 'city', 'run club'],
    description: 'Logo badge thể thao streetwear, biểu tượng đường chạy và đôi cánh năng động.',
    thumbnail: TEMPLATE_MOCKUPS['city-runner'],
    frontDesign: {
      layers: [
        {
          id: 'runner-title',
          type: 'text',
          name: 'Run Club',
          visible: true,
          locked: false,
          zIndex: 1,
          text: 'RUN CLUB',
          fontFamily: 'Montserrat',
          fontSize: 24,
          fontWeight: 800,
          italic: false,
          underline: false,
          textTransform: 'uppercase',
          align: 'center',
          color: '#10b981',
          stroke: '#ffffff',
          strokeWidth: 0,
          opacity: 1,
          x: 50,
          y: 47,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          effect: 'Straight'
        }
      ]
    },
    backDesign: { layers: [] },
    isActive: true,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'preset-block-party',
    slug: 'block-party',
    name: 'Block Party',
    category: 'Streetwear',
    style: 'Streetwear',
    tags: ['streetwear', 'bold', 'graphic', 'color block'],
    description: 'Các mảng khối hình học tương phản mạnh đặt lệch phá cách đầy cá tính.',
    thumbnail: TEMPLATE_MOCKUPS['block-party'],
    frontDesign: {
      layers: [
        {
          id: 'block-title',
          type: 'text',
          name: 'Block',
          visible: true,
          locked: false,
          zIndex: 1,
          text: 'BLOCK',
          fontFamily: 'Montserrat',
          fontSize: 36,
          fontWeight: 900,
          italic: false,
          underline: false,
          textTransform: 'uppercase',
          align: 'center',
          color: '#f43f5e',
          stroke: '#ffffff',
          strokeWidth: 0,
          opacity: 1,
          x: 50,
          y: 47,
          rotation: -3,
          scaleX: 1,
          scaleY: 1,
          effect: 'Straight'
        }
      ]
    },
    backDesign: { layers: [] },
    isActive: true,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'preset-type-study',
    slug: 'type-study',
    name: 'Type Study (Type 01)',
    category: 'Typography',
    style: 'Minimal',
    tags: ['typography', 'type', 'lettering', 'poster'],
    description: 'Bố cục Typography Poster hiện đại nhiều tầng chữ lớn nhỏ đan xen tinh tế.',
    thumbnail: TEMPLATE_MOCKUPS['type-study'],
    frontDesign: {
      layers: [
        {
          id: 'type-title',
          type: 'text',
          name: 'Type 01',
          visible: true,
          locked: false,
          zIndex: 1,
          text: 'TYPE 01',
          fontFamily: 'Montserrat',
          fontSize: 34,
          fontWeight: 900,
          italic: false,
          underline: false,
          textTransform: 'uppercase',
          align: 'center',
          color: '#f97316',
          stroke: '#ffffff',
          strokeWidth: 0,
          opacity: 1,
          x: 50,
          y: 47,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          effect: 'Straight'
        }
      ]
    },
    backDesign: { layers: [] },
    isActive: true,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'preset-retro-sunset',
    slug: 'retro-sunset',
    name: 'Retro Sunset',
    category: 'Vintage',
    style: 'Vintage',
    tags: ['retro', 'sunset', 'summer', 'synthwave'],
    description: 'Hình ảnh mặt trời lặn Synthwave/Retro với các đường cắt ngang và dải màu cam-tím-hồng.',
    thumbnail: TEMPLATE_MOCKUPS['retro-sunset'],
    frontDesign: {
      layers: [
        {
          id: 'sunset-title',
          type: 'text',
          name: 'Sunset',
          visible: true,
          locked: false,
          zIndex: 1,
          text: 'SUNSET',
          fontFamily: 'Montserrat',
          fontSize: 34,
          fontWeight: 900,
          italic: false,
          underline: false,
          textTransform: 'uppercase',
          align: 'center',
          color: '#ec4899',
          stroke: '#ffffff',
          strokeWidth: 0,
          opacity: 1,
          x: 50,
          y: 47,
          rotation: -5,
          scaleX: 1,
          scaleY: 1,
          effect: 'Straight'
        }
      ]
    },
    backDesign: { layers: [] },
    isActive: true,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]
