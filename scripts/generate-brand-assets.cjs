/**
 * Generates official HELP150 Brand Assets:
 * 1. public/logo.svg
 * 2. public/logo.png (1024x1024)
 * 3. public/favicon.png (64x64)
 * 4. public/apple-touch-icon.png (180x180)
 * 5. public/og-image.png (1200x630 - Social Share / Search Engine Preview)
 */

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// 1. Official HELP150 Circular Badge SVG
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <defs>
    <!-- Outer Glow Filter -->
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="sunFlareGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="25" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.8" />
    </filter>

    <!-- Gradients -->
    <!-- Gold Metallic Rim Gradient -->
    <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff5c0" />
      <stop offset="18%" stop-color="#f59e0b" />
      <stop offset="35%" stop-color="#d97706" />
      <stop offset="50%" stop-color="#fffbeb" />
      <stop offset="68%" stop-color="#b45309" />
      <stop offset="85%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#78350f" />
    </linearGradient>

    <!-- Deep Space Navy Radial Background -->
    <radialGradient id="spaceBg" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#0b1d44" />
      <stop offset="60%" stop-color="#050d22" />
      <stop offset="100%" stop-color="#020612" />
    </radialGradient>

    <!-- Earth Atmosphere Radial Gradient -->
    <radialGradient id="earthGlow" cx="50%" cy="30%" r="45%">
      <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.9" />
      <stop offset="40%" stop-color="#2563eb" stop-opacity="0.7" />
      <stop offset="80%" stop-color="#1d4ed8" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#020612" stop-opacity="0" />
    </radialGradient>

    <!-- Earth Globe Gradient -->
    <radialGradient id="globeGrad" cx="45%" cy="35%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="45%" stop-color="#1d4ed8" />
      <stop offset="85%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>

    <!-- Chrome Silver Gradient for HELP -->
    <linearGradient id="chromeSilver" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="30%" stop-color="#f8fafc" />
      <stop offset="52%" stop-color="#cbd5e1" />
      <stop offset="54%" stop-color="#94a3b8" />
      <stop offset="78%" stop-color="#f1f5f9" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>

    <!-- Rich 3D Gold Gradient for 150 -->
    <linearGradient id="goldText" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="25%" stop-color="#fbbf24" />
      <stop offset="55%" stop-color="#f59e0b" />
      <stop offset="80%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#92400e" />
    </linearGradient>

    <!-- Gold Swoosh Gradient -->
    <linearGradient id="swooshGrad" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#d97706" />
      <stop offset="30%" stop-color="#fef08a" />
      <stop offset="70%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#92400e" />
    </linearGradient>

    <!-- Golden Hands Gradient -->
    <linearGradient id="handsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef9c3" />
      <stop offset="40%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>

    <!-- Green Plant Sprout Gradient -->
    <linearGradient id="sproutGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#86efac" />
      <stop offset="50%" stop-color="#22c55e" />
      <stop offset="100%" stop-color="#15803d" />
    </linearGradient>

    <!-- Clipping mask for globe within circle -->
    <clipPath id="innerBadgeClip">
      <circle cx="500" cy="500" r="460" />
    </clipPath>
  </defs>

  <!-- ================= BASE OUTER GOLD RING ================= -->
  <!-- Outer Gold Flare Ring -->
  <circle cx="500" cy="500" r="486" fill="none" stroke="url(#goldRim)" stroke-width="26" filter="url(#goldGlow)" />
  <!-- Crisp Outer Ring Border -->
  <circle cx="500" cy="500" r="486" fill="none" stroke="url(#goldRim)" stroke-width="24" />
  <!-- Inner Thin Golden Highlight Accent -->
  <circle cx="500" cy="500" r="468" fill="none" stroke="#fef08a" stroke-width="3" opacity="0.8" />

  <!-- Inner Badge Dark Background Canvas -->
  <g clip-path="url(#innerBadgeClip)">
    <circle cx="500" cy="500" r="468" fill="url(#spaceBg)" />

    <!-- Distant Cosmic Stars & Spec Nebula -->
    <g opacity="0.6">
      <circle cx="210" cy="220" r="2" fill="#ffffff" />
      <circle cx="340" cy="180" r="1.5" fill="#93c5fd" />
      <circle cx="680" cy="240" r="2.5" fill="#ffffff" />
      <circle cx="790" cy="310" r="2" fill="#bfdbfe" />
      <circle cx="180" cy="450" r="1.5" fill="#ffffff" />
      <circle cx="830" cy="460" r="2" fill="#ffffff" />
      <circle cx="260" cy="740" r="2" fill="#93c5fd" />
      <circle cx="750" cy="730" r="1.5" fill="#ffffff" />
      <circle cx="500" cy="800" r="1" fill="#ffffff" />
      <circle cx="430" cy="780" r="2" fill="#fef08a" />
      <circle cx="580" cy="790" r="2" fill="#93c5fd" />
    </g>

    <!-- ================= PLANET EARTH GLOBE ================= -->
    <!-- Atmosphere Outer Soft Glow -->
    <circle cx="500" cy="290" r="300" fill="url(#earthGlow)" />

    <!-- Planet Earth Sphere -->
    <circle cx="500" cy="290" r="260" fill="url(#globeGrad)" />

    <!-- Continents in Glowing Blue / Cyan / White Relief -->
    <g fill="#60a5fa" opacity="0.95" filter="url(#softGlow)">
      <!-- North America & Greenland -->
      <path d="M 330 200 Q 350 170 380 180 Q 400 200 390 230 Q 350 250 330 220 Z" />
      <path d="M 270 210 Q 310 190 320 230 Q 300 270 260 250 Z" />
      <!-- Eurasia & Europe -->
      <path d="M 440 180 Q 490 160 530 170 Q 560 200 520 220 Q 470 230 450 200 Z" />
      <path d="M 520 170 Q 600 150 670 190 Q 690 230 630 250 Q 570 240 530 200 Z" />
      <path d="M 580 230 Q 640 220 680 260 Q 660 300 600 280 Z" />
      <!-- Africa / Middle East -->
      <path d="M 460 230 Q 510 220 530 260 Q 520 310 470 320 Q 440 280 460 230 Z" />
      <!-- South America tip -->
      <path d="M 340 280 Q 370 270 390 310 Q 370 340 340 320 Z" />
    </g>

    <!-- Earth Atmosphere Rim Outline -->
    <circle cx="500" cy="290" r="260" fill="none" stroke="#93c5fd" stroke-width="4" opacity="0.8" />

    <!-- Sun Flare at 12 O'Clock Top Rim -->
    <g transform="translate(500, 115)">
      <circle cx="0" cy="0" r="16" fill="#ffffff" filter="url(#sunFlareGlow)" />
      <circle cx="0" cy="0" r="8" fill="#fffbeb" />
      <!-- Rays -->
      <line x1="-120" y1="0" x2="120" y2="0" stroke="#fef08a" stroke-width="3" opacity="0.75" />
      <line x1="0" y1="-40" x2="0" y2="40" stroke="#fef08a" stroke-width="3" opacity="0.75" />
      <line x1="-60" y1="-20" x2="60" y2="20" stroke="#fef08a" stroke-width="1.5" opacity="0.6" />
      <line x1="-60" y1="20" x2="60" y2="-20" stroke="#fef08a" stroke-width="1.5" opacity="0.6" />
    </g>

    <!-- ================= PEACE DOVE WITH OLIVE BRANCH (TOP RIGHT) ================= -->
    <g transform="translate(730, 220)" filter="url(#dropShadow)">
      <!-- Olive Twig / Branch in Beak -->
      <path d="M -20 20 Q -45 10 -65 -15" fill="none" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round" />
      <!-- Leaves -->
      <path d="M -60 -10 Q -70 -25 -55 -25 Q -50 -15 -60 -10 Z" fill="#4ade80" />
      <path d="M -45 -2 Q -55 -15 -40 -18 Q -35 -8 -45 -2 Z" fill="#22c55e" />
      <path d="M -30 8 Q -40 -5 -25 -8 Q -20 2 -30 8 Z" fill="#86efac" />

      <!-- Dove Silhouette & Feathers (Pure White with Subtle Shading) -->
      <!-- Body and Head -->
      <path d="M -15 20 C 0 15 25 22 45 40 C 65 60 70 85 60 95 C 45 105 20 90 5 75 C -15 60 -25 40 -15 20 Z" fill="#f8fafc" />
      <!-- Beak -->
      <path d="M -16 22 L -25 24 L -18 27 Z" fill="#f59e0b" />
      <!-- Eye -->
      <circle cx="-5" cy="22" r="2.5" fill="#0f172a" />
      <!-- Wings Raised in Flight -->
      <!-- Left Wing -->
      <path d="M 15 35 C 20 -15 55 -55 95 -75 C 90 -45 75 -20 85 15 C 90 35 75 55 55 60 C 35 60 20 45 15 35 Z" fill="#ffffff" />
      <!-- Wing Feather details -->
      <path d="M 60 -40 C 75 -20 70 5 80 15" fill="none" stroke="#e2e8f0" stroke-width="2.5" />
      <path d="M 45 -20 C 60 0 55 25 65 35" fill="none" stroke="#cbd5e1" stroke-width="2" />
      <!-- Right Wing Behind -->
      <path d="M 40 40 C 50 15 75 -5 110 -15 C 105 10 90 30 95 55 C 80 65 60 55 40 40 Z" fill="#e2e8f0" opacity="0.9" />
      <!-- Tail Feathers -->
      <path d="M 55 90 C 75 115 95 135 115 140 C 105 125 95 105 80 90 Z" fill="#ffffff" />
      <path d="M 50 92 C 65 120 75 140 85 150 C 75 130 65 110 50 92 Z" fill="#e2e8f0" />
    </g>

    <!-- ================= 3D METALLIC TEXT: HELP ================= -->
    <g transform="translate(500, 480)" filter="url(#dropShadow)" text-anchor="middle">
      <!-- Dark 3D extrude shadow layer for HELP -->
      <text x="0" y="5" font-family="'Outfit', 'Montserrat', 'Impact', sans-serif" font-size="190" font-weight="900" letter-spacing="-2" fill="#0f172a">
        HELP
      </text>
      <!-- Metallic Silver-White Face -->
      <text x="0" y="0" font-family="'Outfit', 'Montserrat', 'Impact', sans-serif" font-size="190" font-weight="900" letter-spacing="-2" fill="url(#chromeSilver)">
        HELP
      </text>
      <!-- Crisp White Highlight Contour -->
      <text x="0" y="0" font-family="'Outfit', 'Montserrat', 'Impact', sans-serif" font-size="190" font-weight="900" letter-spacing="-2" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.6">
        HELP
      </text>
    </g>

    <!-- ================= GOLDEN HORIZON SWOOSH CURVE ================= -->
    <path d="M 90 610 Q 500 370 760 480 L 755 498 Q 490 395 100 625 Z" fill="url(#swooshGrad)" filter="url(#goldGlow)" />
    <path d="M 90 610 Q 500 370 760 480 L 755 495 Q 490 395 100 625 Z" fill="url(#swooshGrad)" />

    <!-- ================= 3D GOLD METALLIC TEXT: 150 ================= -->
    <g transform="translate(515, 645)" filter="url(#dropShadow)" text-anchor="middle">
      <!-- 3D Depth Shadow Behind 150 -->
      <text x="0" y="8" font-family="'Outfit', 'Montserrat', 'Impact', sans-serif" font-size="225" font-weight="900" letter-spacing="-1" fill="#451a03">
        150
      </text>
      <!-- Radiant Gold Face -->
      <text x="0" y="0" font-family="'Outfit', 'Montserrat', 'Impact', sans-serif" font-size="225" font-weight="900" letter-spacing="-1" fill="url(#goldText)">
        150
      </text>
      <!-- Glossy Golden Rim Contour -->
      <text x="0" y="0" font-family="'Outfit', 'Montserrat', 'Impact', sans-serif" font-size="225" font-weight="900" letter-spacing="-1" fill="none" stroke="#fef08a" stroke-width="2.5" opacity="0.8">
        150
      </text>
    </g>

    <!-- ================= GOLDEN CUPPED HANDS & SPROUT ================= -->
    <g transform="translate(500, 725)" filter="url(#dropShadow)">
      <!-- Fresh Green Sprout in Palm -->
      <!-- Center Stem -->
      <path d="M 0 0 Q 0 -35 0 -55" fill="none" stroke="#22c55e" stroke-width="5" stroke-linecap="round" />
      <!-- Center Top Leaf -->
      <path d="M 0 -55 Q -18 -85 0 -105 Q 18 -85 0 -55 Z" fill="url(#sproutGrad)" />
      <!-- Left Leaf -->
      <path d="M 0 -45 Q -35 -70 -65 -60 Q -50 -35 0 -35 Z" fill="url(#sproutGrad)" />
      <!-- Right Leaf -->
      <path d="M 0 -45 Q 35 -70 65 -60 Q 50 -35 0 -35 Z" fill="url(#sproutGrad)" />
      <!-- Leaf highlights -->
      <path d="M 0 -55 Q -10 -75 0 -95" fill="none" stroke="#bbf7d0" stroke-width="2" />
      <path d="M 0 -45 Q -25 -55 -45 -50" fill="none" stroke="#bbf7d0" stroke-width="1.5" />
      <path d="M 0 -45 Q 25 -55 45 -50" fill="none" stroke="#bbf7d0" stroke-width="1.5" />

      <!-- Left Cupped Hand -->
      <g fill="url(#handsGrad)">
        <path d="M -15 15 C -45 5 -90 10 -140 -20 C -155 -30 -170 -15 -160 5 C -145 35 -100 65 -40 68 C -20 68 -10 50 -15 15 Z" />
        <path d="M -40 25 C -75 20 -115 10 -155 -5 C -168 -10 -175 5 -165 18 C -145 45 -95 72 -30 72 Z" opacity="0.9" />
        <path d="M -60 40 C -95 35 -130 25 -170 12 C -180 10 -185 22 -175 32 C -150 58 -90 80 -25 78 Z" opacity="0.8" />
      </g>

      <!-- Right Cupped Hand (Mirrored) -->
      <g fill="url(#handsGrad)" transform="scale(-1, 1)">
        <path d="M -15 15 C -45 5 -90 10 -140 -20 C -155 -30 -170 -15 -160 5 C -145 35 -100 65 -40 68 C -20 68 -10 50 -15 15 Z" />
        <path d="M -40 25 C -75 20 -115 10 -155 -5 C -168 -10 -175 5 -165 18 C -145 45 -95 72 -30 72 Z" opacity="0.9" />
        <path d="M -60 40 C -95 35 -130 25 -170 12 C -180 10 -185 22 -175 32 C -150 58 -90 80 -25 78 Z" opacity="0.8" />
      </g>
    </g>

    <!-- ================= SLOGAN & LOWER EMBLEM ================= -->
    <!-- Slogan Text: TOGETHER FOR A BETTER TOMORROW -->
    <g transform="translate(500, 818)" text-anchor="middle" filter="url(#dropShadow)">
      <text x="0" y="0" font-family="'Outfit', 'Plus Jakarta Sans', sans-serif" font-size="28" font-weight="800" letter-spacing="4.5" fill="#ffffff">
        TOGETHER FOR A BETTER TOMORROW
      </text>
    </g>

    <!-- Bottom Golden Accent Flourish with 3-Leaf Sprout -->
    <g transform="translate(500, 852)">
      <!-- Left Golden Line -->
      <line x1="-180" y1="0" x2="-35" y2="0" stroke="url(#goldRim)" stroke-width="3" stroke-linecap="round" />
      <!-- Right Golden Line -->
      <line x1="35" y1="0" x2="180" y2="0" stroke="url(#goldRim)" stroke-width="3" stroke-linecap="round" />
      <!-- Center Mini Sprout Flourish -->
      <path d="M 0 0 Q -10 -18 0 -26 Q 10 -18 0 0 Z" fill="url(#goldRim)" />
      <path d="M 0 -4 Q -16 -12 -24 -6 Q -16 2 0 0 Z" fill="url(#goldRim)" />
      <path d="M 0 -4 Q 16 -12 24 -6 Q 16 2 0 0 Z" fill="url(#goldRim)" />
    </g>
  </g>

  <!-- Specular Golden Rim Flare Glints on Ring -->
  <!-- Top Left Rim Shine -->
  <circle cx="160" cy="180" r="7" fill="#ffffff" filter="url(#goldGlow)" />
  <!-- Bottom Center Rim Shine -->
  <circle cx="500" cy="986" r="8" fill="#ffffff" filter="url(#goldGlow)" />
  <!-- Top Right Rim Flare -->
  <circle cx="840" cy="180" r="7" fill="#ffffff" filter="url(#goldGlow)" />
</svg>`;

// 2. OpenGraph / Twitter Card / Search Engine Link Preview Banner SVG (1200x630)
// This is what WhatsApp, Telegram, Facebook, Twitter, Google, LinkedIn render when a link is shared!
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="ogBg" cx="70%" cy="30%" r="90%">
      <stop offset="0%" stop-color="#0e1e47" />
      <stop offset="50%" stop-color="#081026" />
      <stop offset="100%" stop-color="#030612" />
    </radialGradient>
    <radialGradient id="ogGlow" cx="25%" cy="50%" r="40%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25" />
      <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#030612" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="ogGoldText" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>
    <filter id="ogShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="1200" height="630" fill="url(#ogBg)" />
  <rect width="1200" height="630" fill="url(#ogGlow)" />

  <!-- Grid lines accent -->
  <g stroke="#1e293b" stroke-width="1" opacity="0.3">
    <line x1="0" y1="105" x2="1200" y2="105" />
    <line x1="0" y1="210" x2="1200" y2="210" />
    <line x1="0" y1="315" x2="1200" y2="315" />
    <line x1="0" y1="420" x2="1200" y2="420" />
    <line x1="0" y1="525" x2="1200" y2="525" />
  </g>

  <!-- Embedded Logo on Left -->
  <g transform="translate(60, 65) scale(0.5)" filter="url(#ogShadow)">
    ${logoSvg.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">', '<g>').replace('</svg>', '</g>')}
  </g>

  <!-- Text & Brand Details on Right Side -->
  <g transform="translate(600, 120)">
    <!-- Verified Badge -->
    <g transform="translate(0, 0)">
      <rect width="250" height="38" rx="19" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5" />
      <circle cx="20" cy="19" r="6" fill="#10b981" />
      <text x="35" y="24" font-family="'Outfit', 'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="700" fill="#fef08a" letter-spacing="1.5">
        OFFICIAL COMMUNITY
      </text>
    </g>

    <!-- Main Title -->
    <text x="0" y="100" font-family="'Outfit', 'Montserrat', sans-serif" font-size="64" font-weight="900" fill="#ffffff" letter-spacing="-1">
      HELP<tspan fill="url(#ogGoldText)">150</tspan>
    </text>

    <!-- Tagline -->
    <text x="0" y="145" font-family="'Outfit', 'Plus Jakarta Sans', sans-serif" font-size="22" font-weight="700" fill="#93c5fd" letter-spacing="1">
      Together For A Better Tomorrow
    </text>

    <!-- Subtitle Description -->
    <text x="0" y="195" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="500" fill="#cbd5e1">
      Transparent, peer-coordinated voluntary mutual assistance platform.
    </text>
    <text x="0" y="222" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="500" fill="#94a3b8">
      Real-time peer matching, 12-hour timer windows &amp; verified bank settlement.
    </text>

    <!-- Feature Pills -->
    <g transform="translate(0, 265)">
      <!-- Pill 1 -->
      <g transform="translate(0, 0)">
        <rect width="160" height="34" rx="17" fill="#1e293b" stroke="#334155" stroke-width="1" />
        <text x="14" y="22" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="600" fill="#f8fafc">
          ✓ 100% Peer-to-Peer
        </text>
      </g>
      <!-- Pill 2 -->
      <g transform="translate(175, 0)">
        <rect width="160" height="34" rx="17" fill="#1e293b" stroke="#334155" stroke-width="1" />
        <text x="14" y="22" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="600" fill="#f8fafc">
          ⏱ 12-Hour Timer
        </text>
      </g>
      <!-- Pill 3 -->
      <g transform="translate(350, 0)">
        <rect width="160" height="34" rx="17" fill="#1e293b" stroke="#334155" stroke-width="1" />
        <text x="14" y="22" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="600" fill="#f8fafc">
          🛡 Bank-Grade KYC
        </text>
      </g>
    </g>

    <!-- Official URL Footer bar -->
    <g transform="translate(0, 345)">
      <line x1="0" y1="0" x2="520" y2="0" stroke="#334155" stroke-width="1" />
      <text x="0" y="30" font-family="'Outfit', sans-serif" font-size="16" font-weight="700" fill="#f59e0b" letter-spacing="1">
        help150.org
      </text>
      <text x="115" y="30" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="500" fill="#64748b">
        • Direct Helping • Multi-Level Network • Instant Help
      </text>
    </g>
  </g>

  <!-- Border Frame -->
  <rect x="1" y="1" width="1198" height="628" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.4" />
</svg>`;

// Ensure public directory exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Save logo.svg
fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoSvg, 'utf8');
console.log('Saved public/logo.svg');

// 2. Render logo.png (1024x1024)
const resvgLogo = new Resvg(logoSvg, {
  fitTo: { mode: 'width', value: 1024 },
});
const logoPngData = resvgLogo.render().asPng();
fs.writeFileSync(path.join(publicDir, 'logo.png'), logoPngData);
console.log('Saved public/logo.png (1024x1024)');

// 3. Render favicon.png (64x64) and favicon.ico
const resvgFavicon = new Resvg(logoSvg, {
  fitTo: { mode: 'width', value: 64 },
});
const faviconPngData = resvgFavicon.render().asPng();
fs.writeFileSync(path.join(publicDir, 'favicon.png'), faviconPngData);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconPngData);
console.log('Saved public/favicon.png and public/favicon.ico');

// 4. Render apple-touch-icon.png (180x180)
const resvgTouch = new Resvg(logoSvg, {
  fitTo: { mode: 'width', value: 180 },
});
const touchPngData = resvgTouch.render().asPng();
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), touchPngData);
console.log('Saved public/apple-touch-icon.png (180x180)');

// 5. Save og-image.svg and render og-image.png (1200x630)
fs.writeFileSync(path.join(publicDir, 'og-image.svg'), ogSvg, 'utf8');
const resvgOg = new Resvg(ogSvg, {
  fitTo: { mode: 'width', value: 1200 },
});
const ogPngData = resvgOg.render().asPng();
fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogPngData);
console.log('Saved public/og-image.png (1200x630)');

console.log('All brand assets generated successfully!');
