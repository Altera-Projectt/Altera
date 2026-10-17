const svgThumbnail = (spotlightColor, headline, subline = 'ALTERA 3D STUDIO') => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 625" width="100%" height="100%">
  <defs>
    <radialGradient id="bgSpot" cx="50%" cy="38%" r="62%">
      <stop offset="0%" stop-color="${spotlightColor}" stop-opacity="0.3"/>
      <stop offset="55%" stop-color="#0a1222" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#050812" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="gShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.85"/>
      <stop offset="60%" stop-color="#000000" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#243047"/>
      <stop offset="45%" stop-color="#141d2e"/>
      <stop offset="100%" stop-color="#090e18"/>
    </linearGradient>
    <linearGradient id="sCrease" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="50%" stop-color="#000000" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect width="500" height="625" fill="url(#bgSpot)"/>
  <ellipse cx="250" cy="466" rx="140" ry="20" fill="url(#gShadow)"/>
  <g id="shirt">
    <path d="M 188 126 C 210 148, 290 148, 312 126 C 352 144, 408 178, 436 206 L 388 266 L 344 234 L 344 446 C 344 454, 336 458, 328 458 L 172 458 C 164 458, 156 454, 156 446 L 156 234 L 112 266 L 64 206 C 92 178, 148 144, 188 126 Z" fill="url(#sBody)" stroke="#38bdf8" stroke-width="1" stroke-opacity="0.25"/>
    <path d="M 188 126 C 210 148, 290 148, 312 126 C 352 144, 408 178, 436 206 L 388 266 L 344 234 L 344 446 C 344 454, 336 458, 328 458 L 172 458 C 164 458, 156 454, 156 446 L 156 234 L 112 266 L 64 206 C 92 178, 148 144, 188 126 Z" fill="url(#sCrease)"/>
    <path d="M 188 126 C 218 108, 282 108, 312 126 C 290 140, 210 140, 188 126 Z" fill="#040711"/>
    <path d="M 188 126 C 212 152, 288 152, 312 126" fill="none" stroke="#334155" stroke-width="5" stroke-linecap="round"/>
  </g>
  <g transform="translate(250, 280)">
    <rect x="-70" y="-55" width="140" height="90" rx="8" fill="#090d16" fill-opacity="0.8" stroke="${spotlightColor}" stroke-width="1.2" stroke-opacity="0.5"/>
    <text x="0" y="-10" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="20" font-weight="900" fill="#ffffff" letter-spacing="3">${headline}</text>
    <line x1="-50" y1="6" x2="50" y2="6" stroke="${spotlightColor}" stroke-width="2"/>
    <text x="0" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="7.5" font-weight="700" fill="${spotlightColor}" letter-spacing="2">${subline}</text>
  </g>
</svg>`)}`;

const text = (id, name, value, options = {}) => ({
  id, type: 'text', name, visible: true, locked: false, zIndex: options.zIndex ?? 1,
  text: value, fontFamily: options.fontFamily ?? 'Montserrat', fontSize: options.fontSize ?? 28,
  fontWeight: options.fontWeight ?? 700, italic: false, underline: false, textTransform: 'uppercase',
  align: 'center', color: options.color ?? '#ffffff', stroke: '#060B16', strokeWidth: 0, opacity: 1,
  x: options.x ?? 50, y: options.y ?? 47, rotation: options.rotation ?? 0, scaleX: 1, scaleY: 1, effect: 'Straight',
});

module.exports = [
  { slug: 'abstract-motion', name: 'Abstract Motion', category: 'Abstract', style: 'Graphic', tags: ['abstract', 'motion', 'art', 'neon'], description: 'Đồ họa các dải sóng lượn trừu tượng 3D màu Neon Cyan/Blue chuyển động mạnh mẽ.', thumbnail: svgThumbnail('#06b6d4', 'MOVE', 'ABSTRACT MOTION'), frontDesign: { layers: [text('abstract-motion-shadow', 'Move shadow', 'MOVE', { fontSize: 32, color: '#06b6d4', x: 47, y: 49, rotation: -8 }), text('abstract-motion-title', 'Move', 'MOVE', { fontSize: 28, color: '#ffffff', x: 51, y: 46, rotation: -8, zIndex: 2 })] }, backDesign: { layers: [] } },
  { slug: 'manga-panel', name: 'Manga Panel', category: 'Anime', style: 'Graphic', tags: ['anime', 'manga', 'comic', 'shonen'], description: 'Khung truyện tranh Manga với nét vẽ hành động (action lines), kanji Nhật phong cách shonen.', thumbnail: svgThumbnail('#ef4444', 'MANGA', 'SHONEN PANEL'), frontDesign: { layers: [text('manga-panel-title', 'Manga', 'MANGA', { fontFamily: 'Bebas Neue', fontSize: 34, color: '#ef4444', rotation: -4 }), text('manga-panel-caption', 'Volume 01', 'VOL. 01', { fontSize: 12, y: 54, color: '#ffffff' })] }, backDesign: { layers: [text('manga-panel-back', 'Manga back', 'STORY IN MOTION', { fontSize: 14, y: 40, color: '#ef4444' })] } },
  { slug: 'graphic-orbit', name: 'Graphic Orbit', category: 'Graphic', style: 'Abstract', tags: ['graphic', 'orbit', 'space', 'galaxy'], description: 'Hành tinh với các vành đai quỹ đạo không gian (orbital rings), tọa độ và các chòm sao neon.', thumbnail: svgThumbnail('#38bdf8', 'ORBIT', 'SPACE HORIZON'), frontDesign: { layers: [text('graphic-orbit-title', 'Orbit', 'ORBIT', { fontSize: 28, color: '#38bdf8' }), text('graphic-orbit-caption', 'Beyond limits', 'BEYOND LIMITS', { fontSize: 9, y: 54, color: '#ffffff' })] }, backDesign: { layers: [text('graphic-orbit-back', 'Orbit back', 'EXPLORE MORE', { fontSize: 12, y: 38, color: '#38bdf8' })] } },
  { slug: 'minimal-form', name: 'Minimal Form', category: 'Minimal', style: 'Minimal', tags: ['minimal', 'bauhaus', 'geometry'], description: 'Nghệ thuật tối giản Bauhaus hiện đại với hình học cân đối và typography thanh lịch.', thumbnail: svgThumbnail('#94a3b8', 'FORM', 'BAUHAUS 01'), frontDesign: { layers: [text('minimal-form-title', 'Form', 'FORM', { fontSize: 32, color: '#f8fafc' })] }, backDesign: { layers: [] } },
  { slug: 'city-runner', name: 'City Runner', category: 'Sport', style: 'Streetwear', tags: ['sport', 'running', 'streetwear', 'athletic'], description: 'Typography năng động thể thao đường phố phong cách Athletic/Streetwear typographic badge.', thumbnail: svgThumbnail('#22c55e', 'RUN CLUB', 'ATHLETIC DEPT'), frontDesign: { layers: [text('city-runner-title', 'Run Club', 'RUN CLUB', { fontSize: 24, color: '#22c55e' }), text('city-runner-year', 'Est 2026', 'EST. 2026', { fontSize: 11, y: 55, color: '#ffffff' })] }, backDesign: { layers: [text('city-runner-back', 'City Runner Back', 'CITY RUNNER', { fontSize: 19, y: 35, color: '#22c55e' })] } },
  { slug: 'block-party', name: 'Block Party', category: 'Streetwear', style: 'Streetwear', tags: ['streetwear', 'colorblock', 'popart'], description: 'Color-block mảng màu táo bạo, bố cục bất đối xứng đậm chất pop art hiện đại.', thumbnail: svgThumbnail('#facc15', 'BLOCK', 'COLOR LAB'), frontDesign: { layers: [text('block-party-title', 'Block', 'BLOCK', { fontFamily: 'Bebas Neue', fontSize: 36, color: '#facc15', rotation: -3 }), text('block-party-caption', 'Party', 'PARTY', { fontFamily: 'Bebas Neue', fontSize: 20, color: '#ffffff', y: 55, rotation: -3 })] }, backDesign: { layers: [] } },
  { slug: 'type-study', name: 'Type Study', category: 'Typography', style: 'Minimal', tags: ['typography', 'swiss', 'brutalist'], description: 'Typographic poster Thụy Sĩ (Swiss typography), grid system và bố cục chữ brutalist.', thumbnail: svgThumbnail('#f87171', 'TYPE 01', 'SWISS GRID'), frontDesign: { layers: [text('type-study-title', 'Type 01', 'TYPE 01', { fontFamily: 'Bebas Neue', fontSize: 34, color: '#ffffff' }), text('type-study-caption', 'Letterform series', 'LETTERFORM SERIES', { fontSize: 9, y: 55, color: '#f87171' })] }, backDesign: { layers: [] } },
  { slug: 'retro-sunset', name: 'Retro Sunset', category: 'Vintage', style: 'Vintage', tags: ['retro', 'sunset', 'synthwave', '80s'], description: 'Dải hoàng hôn retro synthwave phong cách thập niên 80 với lưới phối cảnh neon và mặt trời gradient.', thumbnail: svgThumbnail('#f97316', 'SUNSET', 'SYNTHWAVE 84'), frontDesign: { layers: [text('retro-sunset-title', 'Sunset', 'SUNSET', { fontFamily: 'Bebas Neue', fontSize: 34, color: '#f97316', rotation: -5 }), text('retro-sunset-caption', 'California', 'CALIFORNIA', { fontSize: 11, y: 55, color: '#ffffff' })] }, backDesign: { layers: [] } },
];
