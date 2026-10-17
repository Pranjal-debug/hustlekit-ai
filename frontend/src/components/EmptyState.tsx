import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 lg:p-12 text-center rounded-2xl border border-dashed border-[#E5E0D8] bg-[#FBF9F5] shadow-sm ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#F5F1EA] border border-[#E5E0D8] flex items-center justify-center text-[#0A0A0A] mb-4 shadow-sm">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base lg:text-lg font-bold text-[#0A0A0A] tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-[#57534E] max-w-md leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-[#D4FF00] hover:bg-[#C5EE00] text-[#0A0A0A] border border-[#171717] transition-all shadow-sm active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-[#0A0A0A]" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
