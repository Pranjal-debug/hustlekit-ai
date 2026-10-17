import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'demo' | 'success' | 'warning' | 'danger' | 'purple' | 'neutral' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    demo: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
    success: 'bg-[#D4FF00] text-[#0A0A0A] border-[#C5EE00] font-semibold',
    warning: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
    danger: 'bg-rose-100 text-rose-900 border-rose-300 font-semibold',
    purple: 'bg-[#F5F1EA] text-[#0A0A0A] border-[#E5E0D8] font-semibold',
    info: 'bg-[#F5F1EA] text-[#1C1917] border-[#E5E0D8]',
    neutral: 'bg-[#FBF9F5] text-[#0A0A0A] border-[#E5E0D8]',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 rounded-full',
    md: 'text-sm px-3 py-1 rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
