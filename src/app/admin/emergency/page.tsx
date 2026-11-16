'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertOctagon,
  Printer,
  Download,
  RefreshCw,
  Search,
  Users,
  UserCheck,
  Home,
  Maximize2,
  Minimize2,
  Shield,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Visitor {
  id: number;
  full_name: string;
  pass_number: string;
  phone: string;
  organisation: string;
  host_name: string;
  host_department: string;
  visit_purpose: string;
  visitor_type: string;
  vehicle_registration: string;
  location: string;
  check_in_date: string;
  checked_in_by: string;
}

interface StaffMember {
  id: number;
  name: string;
  role: string;
  shift: string;
  email: string;
}

interface EmergencyData {
  timestamp: string;
  currentShift: string;
  headcount: number;
  visitors: Visitor[];
  guestHouseResidents: Visitor[];
  onDutyStaff: StaffMember[];
  counts: { visitors: number; guestHouse: number; onDutyStaff: number };
}

function SectionHeader({
  icon,
  label,
  count,
  color,
  isCommandMode,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  isCommandMode: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-3 border-b ${
        isCommandMode ? 'border-slate-700 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </span>
        <h3
          className={`text-sm font-extrabold uppercase tracking-wider ${
            isCommandMode ? 'text-white' : 'text-slate-800'
          }`}
        >
          {label}
        </h3>
      </div>
      <span
        className={`text-2xl font-black ${isCommandMode ? 'text-emerald-400' : 'text-slate-900'}`}
      >
        {count}
      </span>
    </div>
  );
}

function VisitorTable({
  visitors,
  isCommandMode,
  emptyMsg,
}: {
  visitors: Visitor[];
  isCommandMode: boolean;
  emptyMsg: string;
}) {
  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-100 p-2 space-y-2">
        {visitors.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">{emptyMsg}</div>
        ) : (
          visitors.map((v) => (
            <div
              key={v.id}
              className={`p-3.5 rounded-2xl border ${
                isCommandMode
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-slate-50/70 border-slate-200/80 text-slate-900'
              } space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-[#123B70] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                  {v.pass_number || 'N/A'}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {v.check_in_date
                    ? new Date(v.check_in_date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>
              <div>
                <p className="font-bold text-sm">{v.full_name}</p>
                {v.organisation && <p className="text-xs text-slate-400">{v.organisation}</p>}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 pt-1 border-t border-slate-200/50">
                <span>
                  Host: <strong>{v.host_name || 'General Entry'}</strong>
                </span>
                {v.phone && <span>· 📞 {v.phone}</span>}
                {v.vehicle_registration && (
                  <span className="bg-slate-200 text-slate-900 font-mono px-1.5 py-0.5 rounded text-[11px] font-bold">
                    🚗 {v.vehicle_registration}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead
            className={`${
              isCommandMode
                ? 'bg-slate-950 text-slate-400 border-slate-800'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            } border-b uppercase tracking-wider font-semibold`}
          >
            <tr>
              <th className="py-3 px-3 text-left">Pass #</th>
              <th className="py-3 px-3 text-left">Name</th>
              <th className="py-3 px-3 text-left">Phone</th>
              <th className="py-3 px-3 text-left">Host / Contact</th>
              <th className="py-3 px-3 text-left">Department</th>
              <th className="py-3 px-3 text-left">Vehicle</th>
              <th className="py-3 px-3 text-left">Check-in</th>
              <th className="py-3 px-3 text-left">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visitors.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  {emptyMsg}
                </td>
              </tr>
            ) : (
              visitors.map((v) => (
                <tr
                  key={v.id}
                  className={isCommandMode ? 'hover:bg-slate-950/60' : 'hover:bg-slate-50/80'}
                >
                  <td className="py-3 px-3 font-mono font-bold text-[#123B70]">
                    {v.pass_number || 'N/A'}
                  </td>
                  <td
                    className={`py-3 px-3 font-bold ${isCommandMode ? 'text-white' : 'text-slate-900'}`}
                  >
                    {v.full_name}
                    {v.organisation ? (
                      <span className="block font-normal text-[11px] text-slate-400">
                        {v.organisation}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">{v.phone || '—'}</td>
                  <td className="py-3 px-3 font-medium">{v.host_name || 'General Entry'}</td>
                  <td className="py-3 px-3 text-slate-400">{v.host_department || 'General'}</td>
                  <td className="py-3 px-3 font-mono font-bold">
                    {v.vehicle_registration ? (
                      <span className="bg-slate-200 text-slate-900 px-2 py-0.5 rounded border border-slate-300">
                        {v.vehicle_registration}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono">
                    {v.check_in_date
                      ? new Date(v.check_in_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="py-3 px-3 text-slate-400">{v.location || 'Main Gate'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StaffTable({
  staff,
  isCommandMode,
}: {
  staff: StaffMember[];
  isCommandMode: boolean;
}) {
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden divide-y divide-slate-100 p-2 space-y-2">
        {staff.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No on-duty security staff recorded for this shift.
          </div>
        ) : (
          staff.map((s) => (
            <div
              key={s.id}
              className={`p-3.5 rounded-2xl border ${
                isCommandMode
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-blue-50/60 border-blue-200/80 text-slate-900'
              } space-y-1`}
            >
              <p className="font-bold text-sm">{s.name}</p>
              <p className="text-xs text-slate-400 capitalize">
                {s.role?.replace('_', ' ')} · {s.shift} shift
              </p>
            </div>
          ))
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead
            className={`${
              isCommandMode
                ? 'bg-slate-950 text-slate-400 border-slate-800'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            } border-b uppercase tracking-wider font-semibold`}
          >
            <tr>
              <th className="py-3 px-3 text-left">ID</th>
              <th className="py-3 px-3 text-left">Name</th>
              <th className="py-3 px-3 text-left">Role</th>
              <th className="py-3 px-3 text-left">Shift</th>
              <th className="py-3 px-3 text-left">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  No on-duty security staff recorded for this shift.
                </td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr
                  key={s.id}
                  className={isCommandMode ? 'hover:bg-slate-950/60' : 'hover:bg-blue-50/60'}
                >
                  <td className="py-3 px-3 font-mono text-slate-400">{s.id}</td>
                  <td
                    className={`py-3 px-3 font-bold ${isCommandMode ? 'text-white' : 'text-slate-900'}`}
                  >
                    {s.name}
                  </td>
                  <td className="py-3 px-3 capitalize text-slate-500">
                    {s.role?.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-3 capitalize text-slate-500">{s.shift}</td>
                  <td className="py-3 px-3 text-slate-400">{s.email || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function EmergencyHeadcountPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmergencyData>({
    timestamp: '',
    currentShift: 'day',
    headcount: 0,
    visitors: [],
    guestHouseResidents: [],
    onDutyStaff: [],
    counts: { visitors: 0, guestHouse: 0, onDutyStaff: 0 },
  });
  const [search, setSearch] = useState('');
  const [isCommandMode, setIsCommandMode] = useState(false);

  const fetchEmergencyData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/emergency?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch emergency data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyData();
    const interval = setInterval(fetchEmergencyData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => window.print();
  const handleExportCSV = () => {
    window.location.href = '/api/emergency?format=csv';
  };

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const filterVisitors = (list: Visitor[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (v) =>
        (v.full_name && v.full_name.toLowerCase().includes(q)) ||
        (v.pass_number && v.pass_number.toLowerCase().includes(q)) ||
        (v.phone && v.phone.toLowerCase().includes(q)) ||
        (v.host_name && v.host_name.toLowerCase().includes(q)) ||
        (v.vehicle_registration && v.vehicle_registration.toLowerCase().includes(q))
    );
  };

  const filteredVisitors = filterVisitors(data.visitors || []);
  const filteredGuests = filterVisitors(data.guestHouseResidents || []);
  const filteredStaff = search
    ? (data.onDutyStaff || []).filter(
        (s) =>
          s.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.role?.toLowerCase().includes(search.toLowerCase())
      )
    : data.onDutyStaff || [];

  const totalFiltered = filteredVisitors.length + filteredGuests.length + filteredStaff.length;

  return (
    <div
      className={`space-y-6 max-w-7xl mx-auto transition-all ${
        isCommandMode
          ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-8 overflow-y-auto max-w-none text-white'
          : ''
      }`}
    >
      {/* Top Banner */}
      <div
        className={`${
          isCommandMode ? 'bg-rose-900/80 border-rose-600' : 'bg-rose-700 border-rose-800'
        } text-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-2`}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white text-rose-700 flex items-center justify-center shrink-0 shadow-md animate-pulse">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest">
                {isCommandMode ? 'INCIDENT COMMAND SCREEN' : 'EMERGENCY PROCEDURE'}
              </span>
              <span className="text-xs text-rose-100 font-medium capitalize">
                {data.currentShift} shift · Real-time sync
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              Active Grounds Evacuation Headcount
            </h1>
            <p className="text-xs sm:text-sm text-rose-100/90 mt-0.5">
              Pentecost Convention Centre · Visitors + Guest House + On-Duty Staff
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar: Consistent layout matching dashboard */}
        <div className="flex flex-wrap items-center gap-2 text-xs relative z-10 print:hidden">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white font-semibold border border-white/20">
            <Calendar className="w-3.5 h-3.5 text-rose-200" />
            <span>{todayFormatted}</span>
          </div>

          <Button
            onClick={fetchEmergencyData}
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 h-9 rounded-xl font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="bg-white text-rose-800 hover:bg-rose-50 border-white h-9 rounded-xl font-bold shadow-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>

          <Button
            onClick={() => setIsCommandMode(!isCommandMode)}
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 rounded-xl border border-slate-700 shadow-xs"
          >
            {isCommandMode ? (
              <Minimize2 className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
            )}
            {isCommandMode ? 'Exit Command View' : 'Command View'}
          </Button>

          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black h-9 rounded-xl shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print Evac Sheet
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
        {[
          {
            label: 'TOTAL PERSONS',
            value: data.headcount,
            icon: <Users className="w-6 h-6" />,
            bg: 'bg-rose-500/20 text-rose-500',
          },
          {
            label: 'VISITORS',
            value: data.counts?.visitors ?? 0,
            icon: <UserCheck className="w-6 h-6" />,
            bg: 'bg-emerald-500/20 text-emerald-500',
          },
          {
            label: 'GUEST HOUSE',
            value: data.counts?.guestHouse ?? 0,
            icon: <Home className="w-6 h-6" />,
            bg: 'bg-purple-500/20 text-purple-500',
          },
          {
            label: 'ON-DUTY STAFF',
            value: data.counts?.onDutyStaff ?? 0,
            icon: <Shield className="w-6 h-6" />,
            bg: 'bg-blue-500/20 text-blue-500',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${
              isCommandMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } rounded-2xl p-4 border shadow-sm flex items-center gap-3`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                {stat.label}
              </p>
              <p
                className={`text-3xl font-black ${isCommandMode ? 'text-white' : 'text-slate-900'}`}
              >
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div
        className={`${
          isCommandMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } rounded-2xl p-4 border shadow-sm print:hidden`}
      >
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search by name, pass #, phone, host, vehicle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`pl-10 h-11 rounded-xl ${
              isCommandMode ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500' : ''
            }`}
          />
        </div>
        {search && (
          <p className="text-xs text-slate-400 mt-2">
            Showing {totalFiltered} result{totalFiltered !== 1 ? 's' : ''} across all sections
          </p>
        )}
      </div>

      {/* Printable Header */}
      <div className="hidden print:block border-b-2 border-black pb-3 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold uppercase">PCC EMERGENCY EVACUATION HEADCOUNT</h2>
            <p className="text-sm">
              Total Persons to Account For: {data.headcount} · Shift:{' '}
              {data.currentShift?.toUpperCase()}
            </p>
          </div>
          <div className="text-right text-xs">
            <p>Generated: {new Date().toLocaleString('en-GB')}</p>
            <p className="font-bold text-red-600">OFFICIAL SECURITY USE ONLY</p>
          </div>
        </div>
      </div>

      {/* Section A — Visitors */}
      <div
        className={`${
          isCommandMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } rounded-3xl border shadow-sm overflow-hidden`}
      >
        <SectionHeader
          icon={<UserCheck className="w-4 h-4" />}
          label="Section A — Visitors on Premises"
          count={filteredVisitors.length}
          color="bg-emerald-500/20 text-emerald-500"
          isCommandMode={isCommandMode}
        />
        <VisitorTable
          visitors={filteredVisitors}
          isCommandMode={isCommandMode}
          emptyMsg="No active visitors on premises."
        />
      </div>

      {/* Section B — Guest House */}
      <div
        className={`${
          isCommandMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } rounded-3xl border shadow-sm overflow-hidden`}
      >
        <SectionHeader
          icon={<Home className="w-4 h-4" />}
          label="Section B — Guest House Residents"
          count={filteredGuests.length}
          color="bg-purple-500/20 text-purple-500"
          isCommandMode={isCommandMode}
        />
        <VisitorTable
          visitors={filteredGuests}
          isCommandMode={isCommandMode}
          emptyMsg="No guest house residents currently checked in."
        />
      </div>

      {/* Section C — On-Duty Staff */}
      <div
        className={`${
          isCommandMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } rounded-3xl border shadow-sm overflow-hidden`}
      >
        <SectionHeader
          icon={<Shield className="w-4 h-4" />}
          label={`Section C — On-Duty Security Staff (${data.currentShift?.toUpperCase()} Shift)`}
          count={filteredStaff.length}
          color="bg-blue-500/20 text-blue-500"
          isCommandMode={isCommandMode}
        />
        <StaffTable staff={filteredStaff} isCommandMode={isCommandMode} />
      </div>

      {/* Footer */}
      <div
        className={`text-center text-xs ${
          isCommandMode ? 'text-slate-500' : 'text-slate-400'
        } print:hidden pb-4`}
      >
        Last updated:{' '}
        {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Live'} · Auto-refreshes
        every 10 seconds
      </div>
    </div>
  );
}
