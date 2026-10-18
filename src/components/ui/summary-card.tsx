import React from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  Clock,
  LogOut,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  UserCheck,
  Car,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SummaryBadgeVariant = 'emerald' | 'amber' | 'rose' | 'blue' | 'slate' | 'purple' | 'gold';

const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  'check-circle': CheckCircle2,
  check: CheckCircle2,
  clock: Clock,
  'log-out': LogOut,
  logout: LogOut,
  shield: ShieldCheck,
  'shield-check': ShieldCheck,
  building: Building2,
  calendar: Calendar,
  'user-check': UserCheck,
  car: Car,
  alert: ShieldAlert,
};

export interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon | string;
  iconName?: string;
  iconColor?: string;
  iconBgColor?: string;
  badge?: {
    text: string;
    variant?: SummaryBadgeVariant;
  };
  trend?: {
    value: string;
    positive?: boolean;
  };
  footerText?: string;
  footerAvatars?: string[];
  chartData?: number[];
  chartColor?: string;
  href?: string;
  className?: string;
  live?: boolean;
}

const BADGE_VARIANTS: Record<SummaryBadgeVariant, { bg: string; text: string; dot: string }> = {
  emerald: {
    bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50 text-amber-800 border border-amber-200/70',
    text: 'text-amber-800',
    dot: 'bg-[#C89B3C]',
  },
  rose: {
    bg: 'bg-rose-50 text-rose-700 border border-rose-200/70',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
  blue: {
    bg: 'bg-blue-50 text-blue-800 border border-blue-200/70',
    text: 'text-blue-800',
    dot: 'bg-[#0B3D2E]',
  },
  slate: {
    bg: 'bg-slate-100 text-slate-700 border border-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  },
  purple: {
    bg: 'bg-purple-50 text-purple-700 border border-purple-200/70',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  gold: {
    bg: 'bg-amber-50/80 text-[#8C6B1C] border border-[#E4C77E]/80',
    text: 'text-[#8C6B1C]',
    dot: 'bg-[#C89B3C]',
  },
};

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconName,
  iconColor = 'text-forest',
  iconBgColor = 'bg-forest/10',
  badge,
  trend,
  footerText,
  footerAvatars,
  chartData,
  chartColor = 'bg-[#0B3D2E]/50',
  href,
  className,
  live = true,
}: SummaryCardProps) {
  // Resolve icon whether passed as component or string
  let ResolvedIcon: LucideIcon = Users;
  if (typeof icon === 'string') {
    ResolvedIcon = ICON_MAP[icon.toLowerCase()] || Users;
  } else if (icon) {
    ResolvedIcon = icon;
  } else if (iconName) {
    ResolvedIcon = ICON_MAP[iconName.toLowerCase()] || Users;
  }

  const badgeConfig = badge?.variant ? BADGE_VARIANTS[badge.variant] : BADGE_VARIANTS.emerald;

  const cardContent = (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#D8CFB8]/60 bg-white p-5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0B3D2E]/5 hover:border-[#0B3D2E]/30 flex flex-col justify-between min-h-[175px]',
        className
      )}
    >
      {/* Decorative subtle background watermark icon */}
      <div className="absolute -right-3 -bottom-3 w-28 h-28 pointer-events-none opacity-[0.04] transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 text-[#0B3D2E]">
        <ResolvedIcon className="w-full h-full stroke-[1.5]" />
      </div>

      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {live && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            <h3 className="text-xs sm:text-[13px] font-bold text-slate-700 tracking-tight font-sans truncate">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium truncate">{subtitle}</p>
          )}
        </div>

        {/* Icon Container */}
        <div
          className={cn(
            'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-xs',
            iconBgColor,
            iconColor
          )}
        >
          <ResolvedIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Middle Figure & Chart Row */}
      <div className="my-3 sm:my-4 flex items-end justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl lg:text-[40px] font-black font-mono tracking-tight text-slate-900 leading-none">
              {value}
            </span>
          </div>

          {/* Trend Indicator */}
          {trend && (
            <div className="flex items-center gap-1 mt-1.5 text-xs font-semibold">
              {trend.positive ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{trend.value}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-rose-600">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{trend.value}</span>
                </span>
              )}
              <span className="text-slate-400 font-normal text-[11px]">vs yesterday</span>
            </div>
          )}
        </div>

        {/* Mini sparkline bar chart */}
        {chartData && chartData.length > 0 && (
          <div className="flex items-end gap-1 h-9 px-1 pb-0.5" aria-hidden="true">
            {chartData.map((val, idx) => {
              const heightPercent = Math.max(15, Math.min(100, val));
              return (
                <div
                  key={idx}
                  className="w-1.5 rounded-full transition-all duration-300 group-hover:opacity-100 opacity-60"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: 'currentColor',
                  }}
                >
                  <div
                    className={cn(
                      'w-full h-full rounded-full transition-all duration-300',
                      chartColor
                    )}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Row */}
      <div className="pt-2.5 border-t border-[#D8CFB8]/40 flex items-center justify-between text-xs relative z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {badge && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full',
                badgeConfig.bg
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', badgeConfig.dot)} />
              <span>{badge.text}</span>
            </span>
          )}

          {footerText && (
            <span className="text-[11px] font-medium text-slate-500 truncate">{footerText}</span>
          )}

          {footerAvatars && footerAvatars.length > 0 && (
            <div className="flex -space-x-1.5 overflow-hidden">
              {footerAvatars.slice(0, 3).map((initials, i) => (
                <div
                  key={i}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700 ring-2 ring-white"
                >
                  {initials}
                </div>
              ))}
            </div>
          )}
        </div>

        {href && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B3D2E] group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>View</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 rounded-2xl sm:rounded-3xl">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export default SummaryCard;
