import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface SyncTransparencyProps {
  lastUpdated: Date | string | null;
  isPolling?: boolean;
  intervalSeconds?: number;
  className?: string;
  onRefreshClick?: () => void;
}

export function SyncTransparencyIndicator({
  lastUpdated,
  isPolling = true,
  intervalSeconds = 10,
  className = '',
  onRefreshClick,
}: SyncTransparencyProps) {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : 'Connecting...';

  return (
    <div
      className={`inline-flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800 ${className}`}
      title={`Live polling active every ${intervalSeconds} seconds`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
            isPolling ? 'bg-emerald-400' : 'bg-amber-400'
          } opacity-75`}
        ></span>
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isPolling ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        ></span>
      </span>
      <span>Last updated: {formattedTime}</span>
      {onRefreshClick && (
        <button
          type="button"
          onClick={onRefreshClick}
          aria-label="Refresh live data"
          className="hover:text-white transition-colors"
        >
          <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform duration-500" />
        </button>
      )}
    </div>
  );
}
