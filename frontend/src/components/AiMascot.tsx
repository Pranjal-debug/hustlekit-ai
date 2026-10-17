import React from 'react';

/**
 * AiMascot
 * Glossy, futuristic 3D-styled AI assistant robot matching the reference dashboard.
 */
export const AiMascot: React.FC<{ className?: string }> = ({ className = 'w-36 h-36' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Subtle back-glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#00C9F2]/20 to-[#00E0B0]/20 rounded-full blur-xl pointer-events-none" />

      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 filter drop-shadow-[0_10px_20px_rgba(0,201,242,0.25)]"
      >
        <defs>
          {/* Head & Body metallic gradient */}
          <linearGradient id="robotMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="45%" stopColor="#94A3B8" />
            <stop offset="85%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Visor screen gradient */}
          <linearGradient id="visorGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Glowing cyan eyes & lights */}
          <linearGradient id="eyeCyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#00E0B0" />
            <stop offset="100%" stopColor="#00C9F2" />
          </linearGradient>

          <filter id="eyeGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00C9F2" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Torso & Arms */}
        {/* Left Arm */}
        <path
          d="M 52 135 C 42 145, 45 168, 58 172 C 68 175, 75 162, 70 148 Z"
          fill="url(#robotMetal)"
          opacity="0.95"
        />

        {/* Right Arm */}
        <path
          d="M 148 135 C 158 145, 155 168, 142 172 C 132 175, 125 162, 130 148 Z"
          fill="url(#robotMetal)"
          opacity="0.95"
        />

        {/* Torso */}
        <path
          d="M 68 130 C 68 120, 132 120, 132 130 C 135 155, 125 185, 100 185 C 75 185, 65 155, 68 130 Z"
          fill="url(#robotMetal)"
        />

        {/* Chest Plate Detail */}
        <rect
          x="88"
          y="142"
          width="24"
          height="12"
          rx="6"
          fill="#061A2B"
          stroke="#00C9F2"
          strokeWidth="1.2"
        />
        <circle cx="100" cy="148" r="3" fill="#00E0B0" filter="url(#eyeGlowFilter)" />

        {/* Left Ear Antenna Pod */}
        <rect
          x="34"
          y="78"
          width="12"
          height="28"
          rx="6"
          fill="url(#robotMetal)"
        />
        <rect
          x="36"
          y="84"
          width="8"
          height="16"
          rx="4"
          fill="#061A2B"
          stroke="#00C9F2"
          strokeWidth="1"
        />

        {/* Right Ear Antenna Pod */}
        <rect
          x="154"
          y="78"
          width="12"
          height="28"
          rx="6"
          fill="url(#robotMetal)"
        />
        <rect
          x="156"
          y="84"
          width="8"
          height="16"
          rx="4"
          fill="#061A2B"
          stroke="#00C9F2"
          strokeWidth="1"
        />

        {/* Head Dome */}
        <rect
          x="44"
          y="45"
          width="112"
          height="92"
          rx="44"
          fill="url(#robotMetal)"
        />

        {/* Visor Screen Face */}
        <rect
          x="54"
          y="56"
          width="92"
          height="70"
          rx="32"
          fill="url(#visorGlass)"
          stroke="#1E293B"
          strokeWidth="1.5"
        />

        {/* Visor Glare / Specular highlight */}
        <path
          d="M 68 62 C 85 58, 115 58, 132 62 C 120 70, 80 70, 68 62 Z"
          fill="#FFFFFF"
          opacity="0.18"
        />

        {/* Left Glowing Cyan Eye */}
        <rect
          x="75"
          y="84"
          width="14"
          height="18"
          rx="7"
          fill="url(#eyeCyanGlow)"
          filter="url(#eyeGlowFilter)"
        />

        {/* Right Glowing Cyan Eye */}
        <rect
          x="111"
          y="84"
          width="14"
          height="18"
          rx="7"
          fill="url(#eyeCyanGlow)"
          filter="url(#eyeGlowFilter)"
        />

        {/* Cheerful Eye Sparkles */}
        <circle cx="78" cy="88" r="2.5" fill="#FFFFFF" />
        <circle cx="114" cy="88" r="2.5" fill="#FFFFFF" />
      </svg>
    </div>
  );
};
