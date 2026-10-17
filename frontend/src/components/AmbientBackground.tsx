import React from 'react';

/**
 * AmbientBackground
 * Cinematic, dark, futuristic living environment inspired by the reference dashboard.
 * - Flowing luminous cyan & emerald wave ribbons along viewport base and edge.
 * - Atmospheric deep navy radial glows and faint grid texture.
 * - Strictly pointer-events-none, -z-10, aria-hidden="true".
 * - Fully GPU-accelerated with prefers-reduced-motion support.
 */
export const AmbientBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#03111F]"
    >
      {/* Atmospheric Base Radial Glows */}
      {/* Top-Center Deep Navy Atmosphere */}
      <div
        className="ambient-orb ambient-orb-1 absolute -top-40 left-1/3 w-[700px] h-[500px] rounded-full blur-[140px] opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(0, 201, 242, 0.25) 0%, rgba(6, 26, 43, 0.8) 55%, transparent 75%)',
        }}
      />

      {/* Center-Right Emerald Growth Glow */}
      <div
        className="ambient-orb ambient-orb-2 absolute top-1/4 -right-20 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(0, 224, 176, 0.22) 0%, rgba(3, 17, 31, 0.8) 60%, transparent 80%)',
        }}
      />

      {/* Bottom-Left Cyan Data Velocity Glow */}
      <div
        className="ambient-orb ambient-orb-3 absolute -bottom-20 -left-20 w-[650px] h-[650px] rounded-full blur-[140px] opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(0, 201, 242, 0.3) 0%, rgba(0, 224, 176, 0.15) 45%, transparent 75%)',
        }}
      />

      {/* Subtle High-Tech Grid Pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.02] stroke-[#9BB4C9]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="cinema-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cinema-grid-pattern)" />
      </svg>

      {/* Flowing Luminous Wave Ribbons (Primary Bottom Viewport Wave) */}
      <div className="absolute -bottom-10 left-0 right-0 h-64 md:h-80 w-full overflow-hidden opacity-85">
        <svg
          viewBox="0 0 1920 320"
          preserveAspectRatio="none"
          className="w-full h-full animate-wave-slow"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="waveGradPrimary" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00C9F2" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#00E0B0" stopOpacity="0.9" />
              <stop offset="75%" stopColor="#00C9F2" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="waveGradSoft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00C9F2" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#00E0B0" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#061A2B" stopOpacity="0.05" />
            </linearGradient>

            <filter id="ribbonGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00E0B0" floodOpacity="0.6" />
              <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#00C9F2" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Layer 1: Soft broad wave base */}
          <path
            d="M 0 240 C 320 160, 640 310, 1050 200 C 1450 110, 1720 260, 1920 190"
            fill="none"
            stroke="url(#waveGradSoft)"
            strokeWidth="1.2"
            opacity="0.4"
          />

          {/* Layer 2: Counter wave */}
          <path
            d="M 0 270 C 280 200, 590 320, 980 220 C 1380 130, 1680 280, 1920 220"
            fill="none"
            stroke="url(#waveGradSoft)"
            strokeWidth="1.5"
            opacity="0.3"
          />

          {/* Layer 3: Main glowing ribbon curve */}
          <path
            d="M 0 210 C 260 140, 520 280, 920 180 C 1320 90, 1620 230, 1920 160"
            fill="none"
            stroke="url(#waveGradPrimary)"
            strokeWidth="1.8"
            filter="url(#ribbonGlow)"
          />

          {/* Layer 4: Fine high-frequency accent line */}
          <path
            d="M 0 190 C 240 120, 480 260, 880 160 C 1280 70, 1580 210, 1920 140"
            fill="none"
            stroke="#00E0B0"
            strokeWidth="0.75"
            opacity="0.65"
          />

          {/* Layer 5: Echo curve */}
          <path
            d="M 0 225 C 270 155, 540 295, 940 195 C 1340 105, 1640 245, 1920 175"
            fill="none"
            stroke="#00C9F2"
            strokeWidth="0.8"
            opacity="0.45"
          />

          {/* Glowing node intersections */}
          <circle cx="520" cy="280" r="3" fill="#00E0B0" className="animate-ping" style={{ transformOrigin: '520px 280px', animationDuration: '4s' }} />
          <circle cx="520" cy="280" r="2.5" fill="#FFFFFF" />

          <circle cx="920" cy="180" r="3.5" fill="#00C9F2" className="animate-ping" style={{ transformOrigin: '920px 180px', animationDuration: '5s' }} />
          <circle cx="920" cy="180" r="2.5" fill="#FFFFFF" />

          <circle cx="1320" cy="90" r="3" fill="#00E0B0" className="animate-ping" style={{ transformOrigin: '1320px 90px', animationDuration: '4.5s' }} />
          <circle cx="1320" cy="90" r="2.5" fill="#FFFFFF" />

          <circle cx="1620" cy="230" r="3" fill="#00C9F2" className="animate-ping" style={{ transformOrigin: '1620px 230px', animationDuration: '6s' }} />
          <circle cx="1620" cy="230" r="2" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Floating Stardust Particles (Lightweight pure-CSS nodes) */}
      <div className="absolute inset-0 overflow-hidden">
        {[
          { top: '12%', left: '15%', delay: '0s', duration: '4s', color: 'bg-[#00E0B0]' },
          { top: '24%', left: '78%', delay: '1.2s', duration: '5s', color: 'bg-[#00C9F2]' },
          { top: '42%', left: '32%', delay: '2.5s', duration: '6s', color: 'bg-[#00E0B0]' },
          { top: '52%', left: '86%', delay: '0.8s', duration: '4.5s', color: 'bg-[#00C9F2]' },
          { top: '68%', left: '14%', delay: '1.8s', duration: '5.5s', color: 'bg-[#00E0B0]' },
          { top: '74%', left: '62%', delay: '3.1s', duration: '4s', color: 'bg-[#A855F7]' },
          { top: '84%', left: '40%', delay: '0.4s', duration: '6.5s', color: 'bg-[#00C9F2]' },
          { top: '90%', left: '80%', delay: '2.1s', duration: '5s', color: 'bg-[#00E0B0]' },
        ].map((p, idx) => (
          <span
            key={idx}
            className={`ambient-particle absolute rounded-full ${p.color}`}
            style={{
              top: p.top,
              left: p.left,
              width: idx % 2 === 0 ? '2.5px' : '2px',
              height: idx % 2 === 0 ? '2.5px' : '2px',
              animation: `particlePulse ${p.duration} ease-in-out infinite alternate`,
              animationDelay: p.delay,
              boxShadow: '0 0 8px currentColor',
            }}
          />
        ))}
      </div>
    </div>
  );
};
