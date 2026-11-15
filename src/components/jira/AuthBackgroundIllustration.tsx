"use client";

import React from "react";

export const AuthBackgroundIllustration: React.FC = () => {
  return (
    <div className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0" style={{ paddingTop: '20px' }}>
      {/* Motion Graphics CSS Keyframe Styles */}
      <style jsx>{`
        @keyframes subtle-float-1 {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(2deg);
          }
        }
        @keyframes subtle-float-2 {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-16px) rotate(-3deg);
          }
        }
        @keyframes subtle-float-3 {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-8px) scale(1.03);
          }
        }
        @keyframes beacon-pulse {
          0% {
            r: 2;
            opacity: 0.8;
          }
          50% {
            r: 6;
            opacity: 0.2;
          }
          100% {
            r: 2;
            opacity: 0.8;
          }
        }
        .anim-float-1 {
          animation: subtle-float-1 7s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .anim-float-2 {
          animation: subtle-float-2 9s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .anim-float-3 {
          animation: subtle-float-3 6s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        @keyframes neon-pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(238,0,51,0.65)) drop-shadow(0 0 20px rgba(238,0,51,0.3));
          }
          50% {
            filter: drop-shadow(0 0 18px rgba(244,63,94,0.95)) drop-shadow(0 0 32px rgba(238,0,51,0.55));
          }
        }
        :global(.dark) .neon-poly-glow {
          animation: neon-pulse-glow 5s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient Radial Glows - TamTask Viettel Red / Rose Pink Palette (Soft, Non-glaring in Dark Mode) */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-rose-500/10 dark:from-rose-950/20 via-pink-400/5 dark:via-pink-950/10 to-transparent blur-3xl pointer-events-none transition-colors duration-500" />
      <div className="absolute -bottom-20 -left-20 w-[500px] h-[400px] bg-gradient-to-tr from-[#EE0033]/15 dark:from-[#EE0033]/8 via-rose-400/10 dark:via-rose-950/15 to-transparent blur-3xl pointer-events-none transition-colors duration-500" />
      <div className="absolute -bottom-20 -right-20 w-[500px] h-[400px] bg-gradient-to-tl from-rose-600/15 dark:from-rose-950/20 via-pink-500/10 dark:via-pink-950/15 to-transparent blur-3xl pointer-events-none transition-colors duration-500" />

      {/* Floating Geometric Ambient Cubes & Luminous Polyhedrons (Vibrant Glow in Dark Mode) */}
      <div className="hidden lg:block absolute top-[16%] left-[10%] anim-float-1 neon-poly-glow opacity-85 dark:opacity-95">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <polygon points="24,4 44,15 24,26 4,15" fill="#FDA4AF" className="dark:fill-rose-500" fillOpacity="0.85" />
          <polygon points="4,15 24,26 24,44 4,33" fill="#F43F5E" className="dark:fill-rose-600" fillOpacity="0.9" />
          <polygon points="24,26 44,15 44,33 24,44" fill="#E11D48" className="dark:fill-rose-700" />
        </svg>
      </div>

      <div className="hidden lg:block absolute top-[24%] right-[12%] anim-float-2 neon-poly-glow opacity-85 dark:opacity-95">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <polygon points="20,2 38,12 20,22 2,12" fill="#FFE4E6" className="dark:fill-pink-400" fillOpacity="0.9" />
          <polygon points="2,12 20,22 20,38 2,28" fill="#FB7185" className="dark:fill-rose-500" fillOpacity="0.9" />
          <polygon points="20,22 38,12 38,28 20,38" fill="#BE123C" className="dark:fill-rose-700" />
        </svg>
      </div>

      {/* Luminous Pulsing Sphere (Left Middle) */}
      <div className="hidden md:block absolute bottom-[36%] left-[5%] anim-float-3 neon-poly-glow opacity-80 dark:opacity-95">
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <circle cx="17" cy="17" r="14" stroke="#EE0033" strokeWidth="2" strokeDasharray="5 3" className="dark:stroke-rose-400" />
          <circle cx="17" cy="17" r="7" fill="#EE0033" className="dark:fill-rose-500" />
        </svg>
      </div>

      {/* Glowing Hexagonal Polyhedron (Right Middle) */}
      <div className="hidden md:block absolute bottom-[40%] right-[7%] anim-float-1 neon-poly-glow opacity-80 dark:opacity-95">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <polygon points="18,3 33,11 33,25 18,33 3,25 3,11" stroke="#EE0033" strokeWidth="2" fill="#FFF1F2" className="dark:stroke-rose-400 dark:fill-rose-950/60" fillOpacity="0.6" />
          <circle cx="18" cy="18" r="4" fill="#EE0033" className="dark:fill-rose-400" />
        </svg>
      </div>

      {/* Glowing Octahedral Diamond (Far Right Top) */}
      <div className="hidden xl:block absolute top-[12%] right-[25%] anim-float-3 neon-poly-glow opacity-75 dark:opacity-90">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <polygon points="13,2 24,13 13,24 2,13" stroke="#F43F5E" strokeWidth="2" fill="#FFE4E6" className="dark:stroke-rose-400 dark:fill-rose-900/50" />
        </svg>
      </div>

      {/* Subtle Dot Matrix Background Pattern - visible in both light & dark */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.35] dark:opacity-[0.30]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="tamtask-auth-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#EE0033" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tamtask-auth-dots)" />
      </svg>

      {/* Extra dark mode: larger glowing ball accents scattered (visible only in dark) */}
      <div className="hidden dark:block absolute top-[18%] left-[22%] w-3 h-3 rounded-full bg-rose-500/40 blur-sm animate-pulse" />
      <div className="hidden dark:block absolute top-[55%] left-[18%] w-2 h-2 rounded-full bg-pink-400/35 blur-sm animate-pulse" style={{animationDelay:'1.2s'}} />
      <div className="hidden dark:block absolute top-[30%] right-[20%] w-2.5 h-2.5 rounded-full bg-rose-400/40 blur-sm animate-pulse" style={{animationDelay:'0.7s'}} />
      <div className="hidden dark:block absolute top-[70%] right-[15%] w-2 h-2 rounded-full bg-pink-500/35 blur-sm animate-pulse" style={{animationDelay:'2s'}} />
      <div className="hidden dark:block absolute top-[42%] left-[40%] w-1.5 h-1.5 rounded-full bg-rose-300/30 blur-sm animate-pulse" style={{animationDelay:'0.4s'}} />
      <div className="hidden dark:block absolute top-[20%] right-[38%] w-2 h-2 rounded-full bg-rose-500/30 blur-sm animate-pulse" style={{animationDelay:'1.8s'}} />

      {/* ========================================================
          BOTTOM-LEFT ILLUSTRATION: Isometric Agile Engineering Hub
          (Isometric Platform, Kanban Board, Servers, Engineers)
         ======================================================== */}
      <div className="hidden md:block absolute bottom-0 left-2 sm:left-4 lg:left-8 w-[360px] lg:w-[480px] xl:w-[540px] aspect-[4/3] max-w-[42vw] transition-all duration-300 dark:opacity-90 dark:brightness-95">
        <svg
          viewBox="0 0 540 405"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xl"
        >
          <defs>
            <linearGradient id="rose-plat-top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF1F2" />
              <stop offset="100%" stopColor="#FFE4E6" />
            </linearGradient>
            <linearGradient id="rose-plat-left" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FDA4AF" />
              <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
            <linearGradient id="rose-plat-right" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
            <linearGradient id="red-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EE0033" />
              <stop offset="100%" stopColor="#BE123C" />
            </linearGradient>
            <linearGradient id="server-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFE4E6" />
              <stop offset="100%" stopColor="#FDA4AF" />
            </linearGradient>
          </defs>

          {/* Base Perspective Grid Lines */}
          <path d="M-20 380 L180 280 L420 400" stroke="#EE0033" strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M40 395 L240 295 L460 395" stroke="#EE0033" strokeOpacity="0.15" strokeWidth="1" />
          <path d="M-40 330 L160 230 L380 340" stroke="#EE0033" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="6 6" />

          {/* Lower Isometric Stepped Floor Base */}
          {/* Main Top Face */}
          <polygon points="170,250 370,350 210,430 10,330" fill="url(#rose-plat-top)" stroke="#FDA4AF" strokeWidth="1.5" />
          {/* Left Vertical Face */}
          <polygon points="10,330 210,430 210,460 10,360" fill="url(#rose-plat-left)" />
          {/* Right Vertical Face */}
          <polygon points="210,430 370,350 370,380 210,460" fill="url(#rose-plat-right)" />

          {/* Elevated Upper Platform (Level 2) */}
          <polygon points="90,200 250,280 150,330 -10,250" fill="#FFFFFF" fillOpacity="0.9" stroke="#FECDD3" strokeWidth="1.5" />
          <polygon points="-10,250 150,330 150,345 -10,265" fill="#FDA4AF" />
          <polygon points="150,330 250,280 250,295 150,345" fill="#FB7185" />

          {/* Steps / Staircase */}
          <g transform="translate(180, 310)">
            <polygon points="0,0 30,-15 50,-5 20,10" fill="#FFF1F2" stroke="#FDA4AF" strokeWidth="1" />
            <polygon points="0,0 20,10 20,16 0,6" fill="#F43F5E" />
            <polygon points="20,10 50,-5 50,1 20,16" fill="#E11D48" />

            <polygon points="15,-8 45,-23 65,-13 35,2" fill="#FFF1F2" stroke="#FDA4AF" strokeWidth="1" />
            <polygon points="15,-8 35,2 35,8 15,-2" fill="#F43F5E" />
            <polygon points="35,2 65,-13 65,-7 35,8" fill="#E11D48" />
          </g>

          {/* Isometric Server Rack Tower (Left Side) with Glowing Beacons */}
          <g transform="translate(40, 130)">
            {/* Server Top */}
            <polygon points="30,0 60,15 30,30 0,15" fill="#FFFFFF" stroke="#FDA4AF" strokeWidth="1.5" />
            {/* Server Left */}
            <polygon points="0,15 30,30 30,110 0,95" fill="url(#rose-plat-left)" />
            {/* Server Right */}
            <polygon points="30,30 60,15 60,95 30,110" fill="url(#rose-plat-right)" />

            {/* Server Rack Slots / LED Glows */}
            <line x1="8" y1="36" x2="24" y2="44" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="52" x2="24" y2="60" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="68" x2="24" y2="76" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="84" x2="24" y2="92" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

            {/* Glowing Status Lights with Pulse Animation */}
            <circle cx="26" cy="45" r="1.5" fill="#10B981" />
            <circle cx="26" cy="61" r="1.5" fill="#10B981" />
            <circle cx="26" cy="77" r="1.5" fill="#EE0033" />
            <circle cx="26" cy="93" r="1.5" fill="#10B981" />
          </g>

          {/* Isometric Kanban Board Stand (Center-Right on Platform) */}
          <g transform="translate(130, 135)">
            {/* Board Board Stand Post */}
            <rect x="70" y="80" width="6" height="50" fill="#E11D48" />
            <rect x="15" y="110" width="6" height="40" fill="#E11D48" />

            {/* Isometric Kanban Board Face (Tilted) */}
            <polygon points="0,20 120,-35 120,65 0,120" fill="#FFFFFF" stroke="#EE0033" strokeWidth="2" strokeOpacity="0.8" />
            {/* Board Header Bar in Viettel Red */}
            <polygon points="0,20 120,-35 120,-20 0,35" fill="url(#red-primary-grad)" />

            {/* Column 1: TO DO (Column Line & Cards) */}
            <line x1="40" y1="2" x2="40" y2="95" stroke="#FECDD3" strokeWidth="1" strokeDasharray="3 3" />
            <polygon points="5,42 35,28 35,46 5,60" fill="#FFE4E6" stroke="#FDA4AF" strokeWidth="0.8" />
            <polygon points="5,66 35,52 35,70 5,84" fill="#FFE4E6" stroke="#FDA4AF" strokeWidth="0.8" />

            {/* Column 2: IN PROGRESS (Active Cards) */}
            <line x1="80" y1="-17" x2="80" y2="78" stroke="#FECDD3" strokeWidth="1" strokeDasharray="3 3" />
            <polygon points="45,18 75,4 75,26 45,40" fill="#FEE2E2" stroke="#EE0033" strokeWidth="1" />
            <polygon points="45,46 75,32 75,50 45,64" fill="#FFE4E6" stroke="#FDA4AF" strokeWidth="0.8" />

            {/* Column 3: DONE Cards */}
            <polygon points="85,-5 115,-19 115,-1 85,13" fill="#ECFDF5" stroke="#10B981" strokeWidth="0.8" />
            <polygon points="85,19 115,5 115,23 85,37" fill="#ECFDF5" stroke="#10B981" strokeWidth="0.8" />
          </g>

          {/* Engineer 1: Project Lead (Standing, pointing to board) */}
          <g transform="translate(110, 240)">
            {/* Shadow */}
            <ellipse cx="20" cy="50" rx="14" ry="6" fill="#FDA4AF" fillOpacity="0.6" />
            {/* Legs */}
            <rect x="13" y="30" width="5" height="20" rx="2" fill="#881337" />
            <rect x="22" y="30" width="5" height="20" rx="2" fill="#881337" />
            {/* Body / Viettel Red Blazer */}
            <polygon points="10,12 30,12 32,32 8,32" fill="#EE0033" />
            <polygon points="17,12 23,12 21,32 19,32" fill="#FFFFFF" />
            {/* Head & Hair */}
            <circle cx="20" cy="5" r="6" fill="#FBBF24" />
            <path d="M14 4 C14 -2, 26 -2, 26 4 Z" fill="#92400E" />
            {/* Pointing Arm towards Kanban */}
            <path d="M28 16 L42 8 L44 11 L30 19 Z" fill="#EE0033" />
            <circle cx="44" cy="9" r="2" fill="#FBBF24" />
          </g>

          {/* Engineer 2: Software Engineer (Collaborating with Laptop / Tablet) */}
          <g transform="translate(230, 290)">
            {/* Shadow */}
            <ellipse cx="18" cy="48" rx="12" ry="5" fill="#FDA4AF" fillOpacity="0.5" />
            {/* Legs */}
            <rect x="12" y="28" width="4.5" height="19" rx="2" fill="#475569" />
            <rect x="20" y="28" width="4.5" height="19" rx="2" fill="#475569" />
            {/* Torso / Coral Hoodie */}
            <polygon points="9,11 27,11 29,29 7,29" fill="#F43F5E" />
            {/* Head */}
            <circle cx="18" cy="5" r="5.5" fill="#FDE047" />
            <path d="M13 4 C13 -1, 23 -1, 23 4 Z" fill="#1E293B" />
            {/* Hands holding tablet */}
            <polygon points="5,18 20,22 18,27 3,23" fill="#FFFFFF" stroke="#E11D48" strokeWidth="1" />
            <circle cx="12" cy="22" r="1.5" fill="#EE0033" />
          </g>

          {/* Floating Agile Feature Pill: "SPRINT 1" */}
          <g transform="translate(130, 45)">
            <g className="anim-float-3">
              <rect x="0" y="0" width="78" height="24" rx="12" fill="#FFFFFF" stroke="#EE0033" strokeWidth="1.5" filter="drop-shadow(0 6px 14px rgba(238,0,51,0.22))" />
              <circle cx="12" cy="12" r="4" fill="#EE0033" />
              <text x="22" y="16" fill="#EE0033" fontSize="9.5" fontWeight="800" fontFamily="sans-serif">
                SPRINT 1
              </text>
            </g>
          </g>

          {/* Floating Metric Card: VELOCITY (Positioned to the upper-right of SPRINT 1) */}
          <g transform="translate(215, 15)">
            <g className="anim-float-1">
              <rect x="0" y="0" width="88" height="46" rx="10" fill="#FFFFFF" stroke="#FECDD3" strokeWidth="1.5" filter="drop-shadow(0 6px 14px rgba(238,0,51,0.12))" />
              <text x="8" y="14" fill="#9CA3AF" fontSize="8" fontWeight="700" fontFamily="sans-serif">
                VELOCITY
              </text>
              <text x="8" y="28" fill="#EE0033" fontSize="13" fontWeight="900" fontFamily="sans-serif">
                98.5%
              </text>
              {/* Mini Trend Line */}
              <path d="M46 34 Q58 18, 76 22" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="76" cy="22" r="2.5" fill="#10B981" />
            </g>
          </g>
        </svg>
      </div>

      {/* ========================================================
          BOTTOM-RIGHT ILLUSTRATION: Agile Analytics & Quality Gate
          (Isometric Document, Magnifying Glass, Burndown, Pencil)
         ======================================================== */}
      <div className="hidden md:block absolute bottom-0 right-2 sm:right-4 lg:right-8 w-[360px] lg:w-[480px] xl:w-[540px] aspect-[4/3] max-w-[42vw] transition-all duration-300 dark:opacity-90 dark:brightness-95">
        <svg
          viewBox="0 0 540 405"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xl"
        >
          <defs>
            <linearGradient id="rose-plat-right-top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF1F2" />
              <stop offset="100%" stopColor="#FFE4E6" />
            </linearGradient>
            <linearGradient id="glass-lens" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FECDD3" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FFE4E6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="pencil-body" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Perspective Ground Grid Lines */}
          <path d="M560 380 L360 280 L120 400" stroke="#EE0033" strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M500 395 L300 295 L80 395" stroke="#EE0033" strokeOpacity="0.15" strokeWidth="1" />

          {/* Stepped Base Platform */}
          <polygon points="370,250 170,350 330,430 530,330" fill="url(#rose-plat-right-top)" stroke="#FDA4AF" strokeWidth="1.5" />
          <polygon points="170,350 330,430 330,460 170,380" fill="url(#rose-plat-left)" />
          <polygon points="330,430 530,330 530,360 330,460" fill="url(#rose-plat-right)" />

          {/* Floating Agile Document / Specification (Tall, Angled Card) */}
          <g transform="translate(260, 90)">
            {/* Sheet Shadow */}
            <polygon points="15,40 160,110 145,260 0,190" fill="#FDA4AF" fillOpacity="0.35" />

            {/* Document Body (Isometric Tilt) */}
            <polygon points="10,30 155,100 135,250 -10,180" fill="#FFFFFF" stroke="#FECDD3" strokeWidth="2" filter="drop-shadow(0 8px 16px rgba(244,63,94,0.12))" />

            {/* Folded Top-Right Corner */}
            <polygon points="135,90 155,100 135,110" fill="#FB7185" />

            {/* Document Header Bar */}
            <polygon points="5,45 130,105 125,120 0,60" fill="url(#red-primary-grad)" />
            <circle cx="18" cy="58" r="3" fill="#FFFFFF" />

            {/* Document Text Rows & Checkmarks */}
            <g stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round">
              {/* Row 1 */}
              <line x1="12" y1="80" x2="22" y2="85" />
              <line x1="32" y1="89" x2="115" y2="130" stroke="#E2E8F0" strokeWidth="3" />

              {/* Row 2 */}
              <line x1="8" y1="102" x2="18" y2="107" />
              <line x1="28" y1="111" x2="105" y2="149" stroke="#E2E8F0" strokeWidth="3" />

              {/* Row 3 - Completed Task */}
              <line x1="4" y1="124" x2="14" y2="129" stroke="#10B981" />
              <line x1="24" y1="133" x2="95" y2="168" stroke="#E2E8F0" strokeWidth="3" />

              {/* Row 4 */}
              <line x1="0" y1="146" x2="10" y2="151" stroke="#10B981" />
              <line x1="20" y1="155" x2="85" y2="187" stroke="#E2E8F0" strokeWidth="3" />
            </g>

            {/* Image Placeholder Box */}
            <polygon points="15,180 85,214 78,235 8,201" fill="#FFF1F2" stroke="#FDA4AF" strokeWidth="1" />
            <circle cx="32" cy="195" r="4" fill="#EE0033" fillOpacity="0.4" />
          </g>

          {/* Huge 3D Magnifying Glass Hovering Over Document (Shifted further left — not covering anything) */}
          <g transform="translate(140, 10)">
            <g className="anim-float-2">
              {/* Long Handle */}
              <line x1="55" y1="65" x2="115" y2="135" stroke="#BE123C" strokeWidth="12" strokeLinecap="round" />
              <line x1="55" y1="65" x2="115" y2="135" stroke="#EE0033" strokeWidth="8" strokeLinecap="round" />
              <circle cx="115" cy="135" r="7" fill="#881337" />

              {/* Glass Rim in Bold Viettel Red */}
              <circle cx="45" cy="50" r="40" stroke="#EE0033" strokeWidth="9" fill="url(#glass-lens)" filter="drop-shadow(0 8px 20px rgba(238,0,51,0.25))" />
              <circle cx="45" cy="50" r="35" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.7" fill="none" />

              {/* Specular Glare Arc */}
              <path d="M22 36 A30 30 0 0 1 58 20" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
              <circle cx="68" cy="28" r="2.5" fill="#FFFFFF" />
            </g>
          </g>

          {/* Stylized Agile Pencil Leaning Across Platform */}
          <g transform="translate(230, 270) rotate(-35)">
            <rect x="0" y="0" width="12" height="75" rx="3" fill="url(#pencil-body)" stroke="#D97706" strokeWidth="1" />
            {/* Eraser */}
            <rect x="0" y="-12" width="12" height="12" rx="2" fill="#FB7185" />
            <rect x="0" y="-2" width="12" height="4" fill="#CBD5E1" />
            {/* Tip */}
            <polygon points="0,75 12,75 6,90" fill="#FDE68A" />
            <polygon points="4,85 8,85 6,90" fill="#1E293B" />
          </g>

          {/* Quality Analyst / Reviewer Figure (Inspecting Document) */}
          <g transform="translate(210, 275)">
            {/* Shadow */}
            <ellipse cx="20" cy="50" rx="14" ry="6" fill="#FDA4AF" fillOpacity="0.6" />
            {/* Legs */}
            <rect x="13" y="30" width="5" height="20" rx="2" fill="#0F172A" />
            <rect x="22" y="30" width="5" height="20" rx="2" fill="#0F172A" />
            {/* Torso / Emerald & Red Accent */}
            <polygon points="10,12 30,12 32,32 8,32" fill="#059669" />
            <polygon points="17,12 23,12 21,32 19,32" fill="#FEE2E2" />
            {/* Head & Glasses */}
            <circle cx="20" cy="5" r="6" fill="#FBBF24" />
            <path d="M14 4 C14 -2, 26 -2, 26 4 Z" fill="#475569" />
            {/* Reaching Out Arm */}
            <path d="M28 17 L44 26 L42 29 L26 20 Z" fill="#059669" />
            <circle cx="44" cy="27" r="2.5" fill="#FBBF24" />
          </g>
        </svg>
      </div>
    </div>
  );
};
