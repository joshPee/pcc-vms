'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'destructive' | 'success';
  }
>(({ className, variant = 'default', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-full duration-300',
        variant === 'destructive' && 'bg-red-50 border border-red-200 text-red-700',
        variant === 'success' && 'bg-green-50 border border-green-200 text-green-700',
        variant === 'default' && 'bg-white border border-slate-200 text-slate-900',
        className
      )}
      {...props}
    />
  );
});
Toast.displayName = 'Toast';

export { Toast };
