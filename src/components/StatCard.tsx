'use client';

import { LucideIcon, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export type StatVariant = 'blue' | 'emerald' | 'amber' | 'purple' | 'slate';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: StatVariant;
  trend?: string;
  href?: string;
  size?: 'default' | 'compact';
}

const VARIANT_STYLES: Record<
  StatVariant,
  {
    bgGradient: string;
    border: string;
    iconBg: string;
    iconColor: string;
    valueColor: string;
    accentDot: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  blue: {
    bgGradient: 'from-blue-50/50 via-white to-white dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900',
    border: 'border-blue-100 hover:border-blue-300 dark:border-blue-900/40 dark:hover:border-blue-700/60',
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconColor: 'text-[#123B70] dark:text-blue-400',
    valueColor: 'text-[#123B70] dark:text-white',
    accentDot: 'bg-[#123B70] dark:bg-blue-400',
    badgeBg: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    badgeText: 'Active',
  },
  emerald: {
    bgGradient: 'from-emerald-50/50 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900',
    border: 'border-emerald-100 hover:border-emerald-300 dark:border-emerald-900/40 dark:hover:border-emerald-700/60',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    valueColor: 'text-emerald-950 dark:text-white',
    accentDot: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    badgeText: 'Arrived',
  },
  amber: {
    bgGradient: 'from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900',
    border: 'border-amber-100 hover:border-amber-300 dark:border-amber-900/40 dark:hover:border-amber-700/60',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconColor: 'text-[#C89B3C] dark:text-amber-400',
    valueColor: 'text-amber-950 dark:text-white',
    accentDot: 'bg-[#C89B3C]',
    badgeBg: 'bg-amber-500/10 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
    badgeText: 'Departed',
  },
  purple: {
    bgGradient: 'from-purple-50/50 via-white to-white dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900',
    border: 'border-purple-100 hover:border-purple-300 dark:border-purple-900/40 dark:hover:border-purple-700/60',
    iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    valueColor: 'text-purple-950 dark:text-white',
    accentDot: 'bg-purple-500',
    badgeBg: 'bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    badgeText: 'Expected',
  },
  slate: {
    bgGradient: 'from-slate-50/50 via-white to-white dark:from-slate-800/20 dark:via-slate-900 dark:to-slate-900',
    border: 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-400',
    valueColor: 'text-slate-900 dark:text-white',
    accentDot: 'bg-slate-400',
    badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    badgeText: 'Total',
  },
};

export default function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'blue',
  trend,
  href,
  size = 'default',
}: StatCardProps) {
  const isCompact = size === 'compact';
  const styles = VARIANT_STYLES[variant];

  const content = (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border bg-gradient-to-br ${styles.bgGradient} ${styles.border} shadow-xs hover:shadow-md transition-all duration-200 group p-4 sm:p-5 flex flex-col justify-between`}
    >
      {/* Top Row: Label and Icon Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${styles.accentDot}`} />
          <p className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 tracking-tight">
            {label}
          </p>
        </div>

        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${styles.iconBg} ${styles.iconColor}`}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {/* Middle Figure */}
      <div className="mt-3 sm:mt-4">
        <p className={`font-extrabold font-mono tracking-tight ${styles.valueColor} ${isCompact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>
          {value}
        </p>
      </div>

      {/* Bottom Subtext / Status Tag */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
          {subtext || 'Today'}
        </span>

        {trend ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {trend}
          </span>
        ) : href ? (
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 flex items-center gap-0.5 transition">
            View <ArrowUpRight className="w-3 h-3" />
          </span>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}
