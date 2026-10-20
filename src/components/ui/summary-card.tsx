import React from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  Clock,
  LogOut,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  Calendar,
  Car,
  Package,
  History,
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
  car: Car,
  alert: ShieldAlert,
  package: Package,
  history: History,
  arrow: ArrowRight,
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

const DEFAULT_BAR_DATA = [30, 45, 25, 60, 50, 75, 40, 65, 35, 55, 40, 70, 25, 45, 60, 40];

const BADGE_VARIANTS: Record<SummaryBadgeVariant, { bg: string; text: string; border: string }> = {
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  slate: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  gold: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
};

const AVATAR_COLORS = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-500'];

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconName,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  badge,
  trend,
  footerText,
  footerAvatars,
  chartData,
  chartColor = 'bg-blue-300',
  href,
  className,
  live = false,
}: SummaryCardProps) {
  // Resolve icon
  let ResolvedIcon: LucideIcon = Users;
  if (typeof icon === 'string') {
    ResolvedIcon = ICON_MAP[icon.toLowerCase()] || Users;
  } else if (icon) {
    ResolvedIcon = icon;
  } else if (iconName) {
    ResolvedIcon = ICON_MAP[iconName.toLowerCase()] || Users;
  }

  const badgeConfig = badge?.variant ? BADGE_VARIANTS[badge.variant] : BADGE_VARIANTS.emerald;
  const bars = chartData && chartData.length > 0 ? chartData : DEFAULT_BAR_DATA;

  const cardContent = (
    <div
      className={cn(
        'bg-white rounded-[26px] border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[175px] sm:min-h-[185px]',
        className
      )}
    >
      <div>
        {/* Top Row: Big Number (+ optional green live dot) & Circular Icon Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl sm:text-[34px] font-black text-slate-900 leading-none tracking-tight">
              {value}
            </span>
            {live && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 inline-block" />
            )}
          </div>

          <div
            className={cn(
              'w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
              iconBgColor,
              iconColor
            )}
          >
            <ResolvedIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Second Row: Label */}
        <p className="text-sm font-semibold text-slate-600 mt-2 truncate">
          {title}
        </p>

        {/* Third Row: Status Pill Badge */}
        {(badge || trend) && (
          <div className="mt-2.5">
            <span
              className={cn(
                'inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-md border',
                badgeConfig.bg,
                badgeConfig.text,
                badgeConfig.border
              )}
            >
              {badge?.text || (trend ? trend.value : '')}
            </span>
          </div>
        )}
      </div>

      <div>
        {/* Fourth Row: Vertical Mini Bar Chart */}
        <div className="flex items-end gap-1 h-7 mt-3.5 mb-1" aria-hidden="true">
          {bars.map((val, idx) => {
            const heightPercent = Math.max(18, Math.min(100, val));
            return (
              <div
                key={idx}
                className={cn('w-1.5 rounded-t-sm transition-all duration-300', chartColor)}
                style={{ height: `${heightPercent}%` }}
              />
            );
          })}
        </div>

        {/* Fifth Row: Footer with Overlapping Avatars & Text */}
        <div className="flex items-center gap-2 pt-2 text-xs text-slate-500 font-medium">
          {footerAvatars && footerAvatars.length > 0 && (
            <div className="flex -space-x-1.5 overflow-hidden shrink-0">
              {footerAvatars.slice(0, 3).map((initials, i) => (
                <div
                  key={i}
                  className={cn(
                    'inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white',
                    AVATAR_COLORS[i % AVATAR_COLORS.length]
                  )}
                >
                  {initials}
                </div>
              ))}
            </div>
          )}

          {footerText ? (
            <span className="truncate">{footerText}</span>
          ) : subtitle ? (
            <span className="truncate">{subtitle}</span>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group focus:outline-none focus:ring-2 focus:ring-slate-300 rounded-[26px]">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export default SummaryCard;
