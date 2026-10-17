import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
        isSuccess
          ? 'bg-[#FBF9F5] border-[#171717] text-[#0A0A0A]'
          : isError
          ? 'bg-[#FFF5F5] border-rose-400 text-rose-950'
          : 'bg-[#FBF9F5] border-[#E5E0D8] text-[#0A0A0A]'
      }`}
    >
      <div className="flex items-center gap-2.5 text-xs font-semibold">
        {isSuccess ? (
          <span className="w-5 h-5 rounded-full bg-[#D4FF00] border border-[#171717] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0A0A0A]" />
          </span>
        ) : isError ? (
          <span className="w-5 h-5 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
          </span>
        ) : (
          <span className="w-5 h-5 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0A0A0A]" />
          </span>
        )}
        <span className="text-[#0A0A0A]">{toast.text}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="text-[#57534E] hover:text-[#0A0A0A] p-1 rounded-lg hover:bg-[#F5F1EA] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
