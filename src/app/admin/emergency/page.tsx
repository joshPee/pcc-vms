'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertOctagon,
  Printer,
  Download,
  RefreshCw,
  Search,
  Phone,
  User,
  Car,
  Clock,
  Building,
  ArrowLeft,
  Users,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EmergencyHeadcountPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ headcount: 0, visitors: [], timestamp: '' });
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
    const interval = setInterval(fetchEmergencyData, 10000); // 10s auto-refresh during emergencies
    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    window.location.href = '/api/emergency?format=csv';
  };

  const filteredVisitors = (data.visitors || []).filter((v: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (v.full_name && v.full_name.toLowerCase().includes(q)) ||
      (v.pass_number && v.pass_number.toLowerCase().includes(q)) ||
      (v.phone && v.phone.toLowerCase().includes(q)) ||
      (v.host_name && v.host_name.toLowerCase().includes(q)) ||
      (v.vehicle_registration && v.vehicle_registration.toLowerCase().includes(q))
    );
  });

  return (
    <div className={`space-y-6 max-w-7xl mx-auto transition-all ${
      isCommandMode ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-8 overflow-y-auto max-w-none text-white' : ''
    }`}>
      {/* Top Banner */}
      <div className={`${
        isCommandMode ? 'bg-rose-900/80 border-rose-600' : 'bg-rose-700 border-rose-800'
      } text-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-2`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white text-rose-700 flex items-center justify-center shrink-0 shadow-md animate-pulse">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest">
                {isCommandMode ? 'INCIDENT COMMAND SCREEN' : 'EMERGENCY PROCEDURE'}
              </span>
              <span className="text-xs text-rose-100 font-medium">Real-time sync</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              Active Grounds Evacuation Headcount
            </h1>
            <p className="text-xs sm:text-sm text-rose-100/90 mt-0.5">
              Pentecost Convention Centre · All visitors verified as currently inside premises
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <Button
            onClick={fetchEmergencyData}
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 h-10"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="bg-white text-rose-800 hover:bg-rose-50 border-white h-10 font-bold"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>

          <Button
            onClick={() => setIsCommandMode(!isCommandMode)}
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 border border-slate-700 shadow-md"
          >
            {isCommandMode ? <Minimize2 className="w-4 h-4 mr-1.5" /> : <Maximize2 className="w-4 h-4 mr-1.5" />}
            {isCommandMode ? 'Exit Command View' : 'Command View'}
          </Button>

          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black h-10 shadow-md"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print Evacuation Sheet
          </Button>
        </div>
      </div>

      {/* Headcount Stat & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className={`${isCommandMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl p-5 border shadow-sm flex items-center gap-4`}>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Persons to Account For</p>
            <p className={`text-4xl font-black ${isCommandMode ? 'text-emerald-400' : 'text-slate-900'} mt-0.5`}>
              {data.headcount}
            </p>
          </div>
        </div>

        <div className={`sm:col-span-2 ${isCommandMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl p-5 border shadow-sm flex flex-col justify-center`}>
          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Quick Lookup by Name, Pass #, Phone, Vehicle</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search active visitor on grounds..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-10 h-11 rounded-xl ${isCommandMode ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Printable Header for Printouts */}
      <div className="hidden print:block border-b-2 border-black pb-3 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold uppercase">PCC EMERGENCY HEADCOUNT</h2>
            <p className="text-sm">Evacuation Roster · Total Visitors Inside: {data.headcount}</p>
          </div>
          <div className="text-right text-xs">
            <p>Generated: {new Date().toLocaleString('en-GB')}</p>
            <p className="font-bold text-red-600">OFFICIAL SECURITY USE ONLY</p>
          </div>
        </div>
      </div>

      {/* Directory Table & Mobile Cards */}
      <div className={`${isCommandMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl border shadow-sm overflow-hidden`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className={`text-sm font-extrabold ${isCommandMode ? 'text-white' : 'text-slate-900'}`}>
            Headcount Directory ({filteredVisitors.length} of {data.headcount})
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Last updated: {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Live'}
          </span>
        </div>

        {/* Mobile View: Responsive Card Roster */}
        <div className="md:hidden divide-y divide-slate-100 p-2 space-y-2">
          {filteredVisitors.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              {data.headcount === 0 ? 'All clear! No visitors recorded on premises.' : 'No matching visitors found.'}
            </div>
          ) : (
            filteredVisitors.map((v: any) => (
              <div
                key={v.id}
                className={`p-3.5 rounded-2xl border ${
                  isCommandMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50/70 border-slate-200/80 text-slate-900'
                } space-y-2.5`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#123B70] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {v.pass_number || 'N/A'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    In: {v.check_in_date ? new Date(v.check_in_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm">{v.full_name}</p>
                  {v.organisation && <p className="text-xs text-slate-400">{v.organisation}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1 border-t border-slate-200/50">
                  <span>Host: <strong>{v.host_name || 'General Entry'}</strong></span>
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

        {/* Desktop / Print View: Structured Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead className={`${isCommandMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'} border-b uppercase tracking-wider font-semibold`}>
              <tr>
                <th className="py-3 px-3 text-left">Pass #</th>
                <th className="py-3 px-3 text-left">Visitor Name</th>
                <th className="py-3 px-3 text-left">Contact Phone</th>
                <th className="py-3 px-3 text-left">Host / Contact</th>
                <th className="py-3 px-3 text-left">Department</th>
                <th className="py-3 px-3 text-left">Vehicle Plate</th>
                <th className="py-3 px-3 text-left">Check-in Time</th>
                <th className="py-3 px-3 text-left">Location / Post</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {data.headcount === 0 ? 'All clear! No visitors recorded on premises.' : 'No matching visitors found.'}
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((v: any) => (
                  <tr key={v.id} className={isCommandMode ? 'hover:bg-slate-950/60' : 'hover:bg-slate-50/80'}>
                    <td className="py-3 px-3 font-mono font-bold text-[#123B70]">
                      {v.pass_number || 'N/A'}
                    </td>
                    <td className={`py-3 px-3 font-bold ${isCommandMode ? 'text-white' : 'text-slate-900'}`}>
                      {v.full_name}
                      {v.organisation ? <span className="block font-normal text-[11px] text-slate-400">{v.organisation}</span> : null}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {v.phone || '—'}
                    </td>
                    <td className="py-3 px-3 font-medium">
                      {v.host_name || 'General Entry'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {v.host_department || 'General'}
                    </td>
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
                      {v.check_in_date ? new Date(v.check_in_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {v.location || 'Main Gate'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

