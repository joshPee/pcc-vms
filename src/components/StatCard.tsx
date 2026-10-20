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

export type StatVariant = 'blue' | 'indigo' | 'teal' | 'purple' | 'forest' | 'emerald' | 'amber' | 'gold' | 'slate';

const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  'check-circle': CheckCircle2,
  'check-circle-2': CheckCircle2,
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

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon | string;
  iconName?: string;
  variant?: StatVariant;
  badge?: {
    text: string;
    variant?: 'emerald' | 'blue' | 'purple' | 'amber' | 'slate';
  };
  trend?: string;
  live?: boolean;
  footerText?: string;
  footerAvatars?: string[];
  chartData?: number[];
  href?: string;
  size?: 'default' | 'compact';
}

const DEFAULT_BAR_DATA = [30, 45, 25, 60, 50, 75, 40, 65, 35, 55, 40, 70, 25, 45, 60, 40];

const VARIANT_CONFIG: Record<
  StatVariant,
  {
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    barColor: string;
  }
> = {
  blue: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    barColor: 'bg-blue-300',
  },
  indigo: {
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    barColor: 'bg-indigo-300',
  },
  teal: {
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    barColor: 'bg-teal-300',
  },
  forest: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-[#123B70]',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-[#123B70]',
    badgeBorder: 'border-blue-200',
    barColor: 'bg-blue-400',
  },
  emerald: {
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    barColor: 'bg-emerald-300',
  },
  amber: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    barColor: 'bg-amber-300',
  },
  gold: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    barColor: 'bg-amber-300',
  },
  purple: {
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    barColor: 'bg-purple-300',
  },
  slate: {
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    barColor: 'bg-slate-300',
  },
};

const AVATAR_COLORS = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-500'];

export default function StatCard({
  label,
  value,
  subtext,
  icon,
  iconName,
  variant = 'blue',
  badge,
  trend,
  live,
  footerText,
  footerAvatars,
  chartData,
  href,
  size = 'default',
}: StatCardProps) {
  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.blue;

  // Resolve Icon safely
  let ResolvedIcon: LucideIcon = Users;
  if (typeof icon === 'string') {
    ResolvedIcon = ICON_MAP[icon.toLowerCase()] || Users;
  } else if (icon) {
    ResolvedIcon = icon;
  } else if (iconName) {
    ResolvedIcon = ICON_MAP[iconName.toLowerCase()] || Users;
  }

  // Display badge text
  const badgeText = badge?.text || trend || subtext;
  const bars = chartData && chartData.length > 0 ? chartData : DEFAULT_BAR_DATA;

  const content = (
    <div className="bg-white rounded-2xl sm:rounded-[26px] border border-slate-200/80 p-3 sm:p-5 lg:p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[148px] sm:min-h-[185px]">
      <div>
        {/* Top Row: Large Metric Number (+ optional green live dot) & Circular Icon Badge */}
        <div className="flex items-start justify-between gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl lg:text-[34px] font-black text-slate-900 leading-none tracking-tight">
              {value}
            </span>
            {live && (
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 shrink-0 inline-block" />
            )}
          </div>

          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${cfg.iconBg} ${cfg.iconColor}`}
          >
            <ResolvedIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Second Row: Label / Metric Title */}
        <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1 sm:mt-2 truncate">
          {label}
        </p>

        {/* Third Row: Status Pill Badge */}
        {badgeText && (
          <div className="mt-1.5 sm:mt-2.5">
            <span
              className={`inline-flex items-center text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-md border truncate max-w-full ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
            >
              {badgeText}
            </span>
          </div>
        )}
      </div>

      <div>
        {/* Fourth Row: Vertical Mini Bar Chart */}
        <div className="flex items-end gap-0.5 sm:gap-1 h-5 sm:h-7 mt-2 sm:mt-3.5 mb-1 overflow-hidden" aria-hidden="true">
          {bars.map((val, idx) => {
            const heightPercent = Math.max(18, Math.min(100, val));
            return (
              <div
                key={idx}
                className={`w-1 sm:w-1.5 rounded-t-sm ${cfg.barColor} transition-all duration-300`}
                style={{ height: `${heightPercent}%` }}
              />
            );
          })}
        </div>

        {/* Fifth Row: Footer with Avatars or Description Text */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-1 sm:pt-2 text-[10px] sm:text-xs text-slate-500 font-medium">
          {footerAvatars && footerAvatars.length > 0 && (
            <div className="flex -space-x-1.5 overflow-hidden shrink-0">
              {footerAvatars.slice(0, 3).map((initials, i) => (
                <div
                  key={i}
                  className={`inline-flex h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 items-center justify-center rounded-full text-[9px] sm:text-[10px] font-bold text-white ring-1 sm:ring-2 ring-white ${
                    AVATAR_COLORS[i % AVATAR_COLORS.length]
                  }`}
                >
                  {initials}
                </div>
              ))}
            </div>
          )}

          {footerText ? (
            <span className="truncate">{footerText}</span>
          ) : subtext ? (
            <span className="truncate">{subtext}</span>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group focus:outline-none focus:ring-2 focus:ring-slate-300 rounded-[26px]">
        {content}
      </Link>
    );
  }

  return content;
}
