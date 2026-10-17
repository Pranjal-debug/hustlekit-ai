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
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#FBF9F5]"
    >
      {/* Subtle warm paper texture / editorial micro-grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04] stroke-[#0A0A0A]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="editorial-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#editorial-grid)" />
      </svg>

      {/* Gentle, restrained warm ivory depth wash */}
      <div
        className="absolute -top-32 -right-20 w-[550px] h-[550px] rounded-full blur-[130px] opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #EBE5DB 0%, #F5F1EA 60%, transparent 80%)',
        }}
      />
      <div
        className="absolute -bottom-32 -left-20 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #F5F1EA 0%, #EBE5DB 55%, transparent 75%)',
        }}
      />
    </div>
  );
};
