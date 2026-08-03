"use client";
 
export default function AuthBackgroundSvg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none">
      <svg
        className="w-full h-full min-w-[1000px] min-h-[600px]"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Base Background Gradient covering all 4 corners */}
          <linearGradient id="bg-base" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CBE5FF" />
            <stop offset="35%" stopColor="#DFEFFF" />
            <stop offset="70%" stopColor="#D8ECFF" />
            <stop offset="100%" stopColor="#C4E2FF" />
          </linearGradient>
 
          {/* Top-Right Soft Light Blue Wash */}
          <radialGradient id="top-right-glow" cx="100%" cy="0%" r="75%">
            <stop offset="0%" stopColor="#A8D6FF" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#CCE5FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#EBF5FF" stopOpacity="0" />
          </radialGradient>
 
          {/* Bottom-Left Soft Light Blue Wash */}
          <radialGradient id="bottom-left-glow" cx="0%" cy="100%" r="75%">
            <stop offset="0%" stopColor="#9ECEFF" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#C6E3FF" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#EBF5FF" stopOpacity="0" />
          </radialGradient>
 
          {/* Top-Left Light Blue Wash */}
          <radialGradient id="top-left-glow" cx="0%" cy="0%" r="75%">
            <stop offset="0%" stopColor="#A0D2FF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#C8E4FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#EBF5FF" stopOpacity="0" />
          </radialGradient>
 
          {/* Bottom-Right Light Blue Wash */}
          <radialGradient id="bottom-right-glow" cx="100%" cy="100%" r="75%">
            <stop offset="0%" stopColor="#94C8FF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#C0E0FF" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#EBF5FF" stopOpacity="0" />
          </radialGradient>
 
          {/* Soft Center White Highlight for clean card readability */}
          <radialGradient id="center-white-highlight" cx="50%" cy="50%" r="48%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
 
          {/* Translucent Blue Hexagon Fill */}
          <linearGradient id="hex-fill-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0080FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0066CC" stopOpacity="0.12" />
          </linearGradient>
 
          {/* Solid Accent Blue Hexagon Fill */}
          <linearGradient id="hex-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0094FF" />
            <stop offset="100%" stopColor="#006CD9" />
          </linearGradient>
        </defs>
 
        {/* 1. Base Layer */}
        <rect width="100%" height="100%" fill="url(#bg-base)" />
 
        {/* 2. Four Corner Light Blue Color Washes */}
        <rect width="100%" height="100%" fill="url(#top-left-glow)" />
        <rect width="100%" height="100%" fill="url(#top-right-glow)" />
        <rect width="100%" height="100%" fill="url(#bottom-left-glow)" />
        <rect width="100%" height="100%" fill="url(#bottom-right-glow)" />
 
        {/* 3. Soft Center Glow */}
        <rect width="100%" height="100%" fill="url(#center-white-highlight)" />
 
        {/* ================= TOP-LEFT HEXAGON NETWORK PATTERN ================= */}
        <g opacity="0.88">
          {/* Interlocking Translucent & Outlined Hexagons */}
          <polygon points="120,20 180,55 180,125 120,160 60,125 60,55" fill="url(#hex-fill-light)" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.4" />
          <polygon points="260,70 320,105 320,175 260,210 200,175 200,105" fill="url(#hex-fill-light)" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.45" />
          <polygon points="170,180 230,215 230,285 170,320 110,285 110,215" fill="none" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.38" />
          <polygon points="50,140 100,170 100,225 50,255 0,225 0,170" fill="url(#hex-fill-light)" stroke="#0080FF" strokeWidth="1.2" strokeOpacity="0.3" />
 
          {/* Solid Blue Accent Hexagon */}
          <polygon points="115,396 145,413 145,448 115,465 85,448 85,413" fill="url(#hex-accent)" />
 
          {/* Connecting Grid Lines */}
          <polyline points="180,55 260,70 320,105 380,80" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.45" />
          <polyline points="120,160 170,180 260,210" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.45" />
          <polyline points="60,125 110,215 50,255" stroke="#0080FF" strokeWidth="1.2" strokeOpacity="0.35" />
          <line x1="200" y1="105" x2="180" y2="55" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.45" />
          <line x1="230" y1="215" x2="320" y2="175" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.45" />
          <line x1="170" y1="320" x2="115" y2="396" stroke="#0080FF" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="3 3" />
          <line x1="320" y1="105" x2="480" y2="40" stroke="#0080FF" strokeWidth="1.2" strokeOpacity="0.35" />
 
          {/* Vertex Node Dots */}
          <circle cx="180" cy="55" r="4.5" fill="#0080FF" />
          <circle cx="260" cy="70" r="4" fill="#0080FF" />
          <circle cx="320" cy="105" r="5" fill="#0080FF" />
          <circle cx="200" cy="105" r="4" fill="#0080FF" />
          <circle cx="120" cy="160" r="4" fill="#0080FF" opacity="0.85" />
          <circle cx="170" cy="180" r="4.5" fill="#0080FF" />
          <circle cx="230" cy="215" r="4" fill="#0080FF" />
          <circle cx="260" cy="210" r="4.5" fill="#0080FF" />
          <circle cx="550" cy="80" r="16" fill="url(#hex-accent)" opacity="0.95" />
          <circle cx="70" cy="177" r="5" fill="#0080FF" opacity="0.9" />
          <circle cx="30" cy="180" r="6" fill="#0080FF" opacity="0.8" />
        </g>
 
        {/* ================= BOTTOM-RIGHT HEXAGON NETWORK PATTERN ================= */}
        <g opacity="0.88">
          {/* Interlocking Translucent & Outlined Hexagons */}
          <polygon points="1260,540 1330,580 1330,660 1260,700 1190,660 1190,580" fill="url(#hex-fill-light)" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.4" />
          <polygon points="1370,620 1440,660 1440,740 1370,780 1300,740 1300,660" fill="url(#hex-fill-light)" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.45" />
          <polygon points="1130,630 1190,665 1190,735 1130,770 1070,735 1070,665" fill="none" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.38" />
          <polygon points="1220,720 1290,760 1290,840 1220,880 1150,840 1150,760" fill="url(#hex-fill-light)" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.4" />
          <polygon points="1350,780 1420,820 1420,900 1350,940 1280,900 1280,820" fill="url(#hex-fill-light)" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.35" />
 
          {/* Solid Blue Accent Hexagons */}
          <polygon points="1090,780 1140,808 1140,865 1090,893 1040,865 1040,808" fill="url(#hex-accent)" />
          <polygon points="1270,780 1320,808 1320,865 1270,893 1220,865 1220,808" fill="url(#hex-accent)" />
 
          {/* Connecting Grid Lines */}
          <polyline points="1260,580 1190,580 1130,630" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.45" />
          <polyline points="1330,660 1370,660 1440,660" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.45" />
          <line x1="1260" y1="700" x2="1220" y2="720" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.45" />
          <line x1="1190" y1="735" x2="1220" y2="720" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.45" />
          <line x1="1130" y1="770" x2="1090" y2="780" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.45" />
          <line x1="1290" y1="760" x2="1350" y2="780" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.45" />
          <line x1="1220" y1="880" x2="1270" y2="893" stroke="#0080FF" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="3 3" />
          <line x1="1190" y1="580" x2="1140" y2="520" stroke="#0080FF" strokeWidth="1.2" strokeOpacity="0.35" />
 
          {/* Vertex Node Dots */}
          <circle cx="1260" cy="580" r="4.5" fill="#0080FF" />
          <circle cx="1190" cy="580" r="4" fill="#0080FF" />
          <circle cx="1130" cy="630" r="5" fill="#0080FF" />
          <circle cx="1330" cy="660" r="4" fill="#0080FF" />
          <circle cx="1370" cy="660" r="4.5" fill="#0080FF" opacity="0.85" />
          <circle cx="1260" cy="700" r="4" fill="#0080FF" />
          <circle cx="1220" cy="720" r="5" fill="#0080FF" />
          <circle cx="1190" cy="735" r="4" fill="#0080FF" />
          <circle cx="1290" cy="760" r="4.5" fill="#0080FF" />
 
          {/* Node Circles matching the reference image */}
          <circle cx="1100" cy="410" r="18" fill="#80C4FF" opacity="0.6" />
          <circle cx="1335" cy="480" r="9" fill="url(#hex-accent)" opacity="0.95" />
          <circle cx="1290" cy="310" r="5" fill="#0080FF" opacity="0.85" />
          <circle cx="820" cy="850" r="20" fill="#80C4FF" opacity="0.55" stroke="#0080FF" strokeWidth="1" strokeOpacity="0.4" />
          <circle cx="905" cy="700" r="8" fill="#0080FF" opacity="0.9" />
          <circle cx="1000" cy="775" r="5" fill="#0080FF" opacity="0.85" />
          <circle cx="1000" cy="860" r="5" fill="#0080FF" opacity="0.85" />
          <circle cx="1245" cy="640" r="4" fill="#0080FF" opacity="0.8" />
          <circle cx="1325" cy="950" r="5" fill="#0080FF" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}
 
 