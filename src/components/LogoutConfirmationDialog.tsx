'use client';

import * as React from 'react';
import { LogOut, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  loading?: boolean;
}

export function LogoutConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Sign Out',
  description = 'Are you sure you want to log out of your session? You will need to sign in again to access the terminal.',
  loading = false,
}: LogoutDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 z-10 overflow-hidden animate-in zoom-in-95 duration-200 space-y-4">
        {/* PCC Tri-Color Ribbon */}
        <div className="flex h-1 w-full -mx-6 -mt-6 rounded-t-3xl overflow-hidden mb-4">
          <div className="flex-1 bg-[#123B70]" />
          <div className="flex-1 bg-[#E5A823]" />
          <div className="flex-1 bg-[#C5222E]" />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 font-medium">Pentecost Convention Centre</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="h-9 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs shadow-rose-600/30"
          >
            {loading ? 'Signing out...' : 'Yes, Sign Out'}
          </Button>
        </div>
      </div>
    </div>
  );
}
