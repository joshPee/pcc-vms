import React from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  Clock,
  LogOut,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  Car,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

export type StatVariant = 'forest' | 'blue' | 'emerald' | 'amber' | 'gold' | 'purple' | 'slate';

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
};

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon | string;
  iconName?: string;
  variant?: StatVariant;
  trend?: string;
  trendPositive?: boolean;
  href?: string;
  size?: 'default' | 'compact';
  chartData?: number[];
}

const VARIANT_CONFIG: Record<
  StatVariant,
  {
    bgCard: string;
    border: string;
    glowBorder: string;
    iconGradient: string;
    iconShadow: string;
    accentDot: string;
    pulseDot: string;
    pillBg: string;
    pillText: string;
    watermarkColor: string;
    barColor: string;
  }
> = {
  forest: {
    bgCard: 'bg-white',
    border: 'border-slate-200/90',
    glowBorder: 'hover:border-[#0B3D2E]/40 hover:shadow-lg hover:shadow-slate-900/5',
    iconGradient: 'from-[#0B3D2E] to-[#14533e] text-white',
    iconShadow: 'shadow-md shadow-[#0B3D2E]/20',
    accentDot: 'bg-[#0B3D2E]',
    pulseDot: 'bg-emerald-400',
    pillBg: 'bg-emerald-50 border border-emerald-200/80',
    pillText: 'text-emerald-800',
    watermarkColor: 'text-[#0B3D2E]/[0.04]',
    barColor: 'bg-[#0B3D2E]',
  },
  blue: {
    bgCard: 'bg-white',
    border: 'border-slate-200/90',
    glowBorder: 'hover:border-blue-400/50 hover:shadow-lg hover:shadow-slate-900/5',
    iconGradient: 'from-[#123B70] to-[#1e5aa0] text-white',
    iconShadow: 'shadow-md shadow-[#123B70]/20',
    accentDot: 'bg-[#123B70]',
    pulseDot: 'bg-blue-400',
    pillBg: 'bg-blue-50 border border-blue-200/80',
    pillText: 'text-blue-800',
    watermarkColor: 'text-blue-900/[0.04]',
    barColor: 'bg-[#123B70]',
  },
  emerald: {
    bgCard: 'bg-white',
    border: 'border-slate-200/90',
    glowBorder: 'hover:border-emerald-400/50 hover:shadow-lg hover:shadow-slate-900/5',
    iconGradient: 'from-emerald-600 to-teal-700 text-white',
    iconShadow: 'shadow-md shadow-emerald-600/20',
    accentDot: 'bg-emerald-600',
    pulseDot: 'bg-emerald-400',
    pillBg: 'bg-emerald-50 border border-emerald-200/80',
    pillText: 'text-emerald-800',
    watermarkColor: 'text-emerald-900/[0.04]',
    barColor: 'bg-emerald-600',
  },
  amber: {
    bgCard: 'bg-white',
    border: 'border-slate-200/90',
    glowBorder: 'hover:border-[#C89B3C]/50 hover:shadow-lg hover:shadow-slate-900/5',
    iconGradient: 'from-[#C89B3C] to-[#b3862b] text-white',
    iconShadow: 'shadow-md shadow-[#C89B3C]/20',
    accentDot: 'bg-[#C89B3C]',
    pulseDot: 'bg-amber-400',
    pillBg: 'bg-amber-50 border border-amber-200/80',
    pillText: 'text-amber-900',
    watermarkColor: 'text-amber-900/[0.04]',
    barColor: 'bg-[#C89B3C]',
  },
  gold: {
    bgCard: 'bg-white',
    border: 'border-slate-200/90',
    glowBorder: 'hover:border-[#C89B3C]/50 hover:shadow-lg hover:shadow-slate-900/5',
    iconGradient: 'from-[#C89B3C] to-[#997320] text-white',
    iconShadow: 'shadow-md shadow-[#C89B3C]/20',
    accentDot: 'bg-[#C89B3C]',
    pulseDot: 'bg-amber-400',
    pillBg: 'bg-amber-50 border border-amber-200/80',
    pillText: 'text-[#8C6B1C]',
    watermarkColor: 'text-[#C89B3C]/[0.04]',
    barColor: 'bg-[#C89B3C]',
  },
  purple: {
    bgCard: 'bg-white',
    border: 'border-slate-200/90',
    glowBorder: 'hover:border-purple-400/50 hover:shadow-lg hover:shadow-slate-900/5',
    iconGradient: 'from-purple-600 to-indigo-700 text-white',
    iconShadow: 'shadow-md shadow-purple-600/20',
    accentDot: 'bg-purple-600',
    pulseDot: 'bg-purple-400',
    pillBg: 'bg-purple-50 border border-purple-200/80',
    pillText: 'text-purple-800',
    watermarkColor: 'text-purple-900/[0.04]',
    barColor: 'bg-purple-600',
  },
  slate: {
    bgCard: 'bg-white',
    border: 'border-slate-200/90',
    glowBorder: 'hover:border-slate-400 hover:shadow-lg hover:shadow-slate-900/5',
    iconGradient: 'from-slate-700 to-slate-900 text-white',
    iconShadow: 'shadow-md shadow-slate-700/20',
    accentDot: 'bg-slate-600',
    pulseDot: 'bg-slate-400',
    pillBg: 'bg-slate-100 border border-slate-200/80',
    pillText: 'text-slate-700',
    watermarkColor: 'text-slate-900/[0.04]',
    barColor: 'bg-slate-600',
  },
};

export default function StatCard({
  label,
  value,
  subtext,
  icon,
  iconName,
  variant = 'blue',
  trend,
  href,
  size = 'default',
  chartData,
}: StatCardProps) {
  const isCompact = size === 'compact';
  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.blue;

  // Resolve Icon safely regardless of whether string or component is passed
  let ResolvedIcon: LucideIcon = Users;
  if (typeof icon === 'string') {
    ResolvedIcon = ICON_MAP[icon.toLowerCase()] || Users;
  } else if (icon) {
    ResolvedIcon = icon;
  } else if (iconName) {
    ResolvedIcon = ICON_MAP[iconName.toLowerCase()] || Users;
  }

  const content = (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border ${cfg.bgCard} ${cfg.border} ${cfg.glowBorder} transition-all duration-200 group p-4 sm:p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[172px] hover:-translate-y-1 shadow-xs`}
    >
      {/* Background Watermark Icon for Rich Depth without Color Pollution */}
      <div
        className={`absolute -right-3 -bottom-3 w-28 h-28 pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 ${cfg.watermarkColor}`}
      >
        <ResolvedIcon className="w-full h-full stroke-[1.2]" />
      </div>

      {/* Top Row: Label with Status Pulse + Elevated Clean Icon Badge */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.pulseDot}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.accentDot}`} />
            </span>
            <p className="text-xs sm:text-[13px] font-bold text-slate-700 tracking-tight">
              {label}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {subtext || 'Live Metric'}
          </p>
        </div>

        {/* Floating Gradient Icon Badge */}
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${cfg.iconGradient} ${cfg.iconShadow} transition-all duration-200 group-hover:scale-105 shrink-0 ring-4 ring-slate-50`}
        >
          <ResolvedIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Metric Figure Section with Crisp Slate-900 Contrast + Sparkline Bar Chart */}
      <div className="mt-2.5 sm:mt-3 flex items-end justify-between gap-2 relative z-10">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-black font-mono tracking-tight text-slate-900 ${
              isCompact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl lg:text-5xl'
            }`}
          >
            {value}
          </span>
        </div>

        {/* Refined Sparkline Bar Chart */}
        {chartData && chartData.length > 0 && (
          <div className="flex items-end gap-1 h-8 px-1 pb-0.5" aria-hidden="true">
            {chartData.map((val, idx) => {
              const heightPercent = Math.max(15, Math.min(100, val));
              return (
                <div
                  key={idx}
                  className={`w-1.5 rounded-full ${cfg.barColor} transition-all duration-300 opacity-70 group-hover:opacity-100`}
                  style={{ height: `${heightPercent}%` }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Footer / Micro-Metrics & Link */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
        {trend ? (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.pillBg} ${cfg.pillText}`}
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>{trend}</span>
          </span>
        ) : (
          <span className="text-[11px] font-medium text-slate-400">
            Real-time sync
          </span>
        )}

        {href && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-950 group-hover:translate-x-0.5 transition-transform">
            <span>Explore</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-slate-300 rounded-2xl sm:rounded-3xl">
        {content}
      </Link>
    );
  }

  return content;
}
