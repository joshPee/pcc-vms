'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export interface ModernToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'info';
  title?: string;
  description?: string;
}

const Toast = React.forwardRef<HTMLDivElement, ModernToastProps>(
  ({ className, variant = 'default', title, description, children, ...props }, ref) => {
    const icons = {
      success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 animate-bounce" />,
      destructive: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />,
      info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
      default: <Sparkles className="w-5 h-5 text-[#E5A823] shrink-0" />,
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(
          'fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl',
          'transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-4 sm:slide-in-from-right-4',
          'max-w-sm w-full sm:w-auto min-w-[280px]',
          variant === 'success' && 'bg-white/95 border-emerald-200 text-slate-900 shadow-emerald-500/10 ring-1 ring-emerald-500/20',
          variant === 'destructive' && 'bg-white/95 border-rose-200 text-slate-900 shadow-rose-500/10 ring-1 ring-rose-500/20',
          variant === 'info' && 'bg-white/95 border-blue-200 text-slate-900 shadow-blue-500/10 ring-1 ring-blue-500/20',
          variant === 'default' && 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10 ring-1 ring-slate-900/5',
          className
        )}
        {...props}
      >
        <div className="mt-0.5">{icons[variant]}</div>
        <div className="flex-1 min-w-0">
          {title && <p className="text-xs font-black tracking-tight text-slate-900">{title}</p>}
          {description && <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{description}</p>}
          {children && <div className="text-xs font-semibold">{children}</div>}
        </div>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export { Toast };
