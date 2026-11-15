'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Printer,
  Download,
  Copy,
  Check,
  Home,
  ShieldCheck,
  Calendar,
  Building,
  User,
  Clock,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

function RegistrationSuccessContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isGuard = session?.user?.role === 'security_officer' || session?.user?.role === 'supervisor';
  const isAdmin = session?.user?.role === 'admin';
  const returnHref = isGuard ? '/guard' : (isAdmin ? '/admin/dashboard' : '/');
  const returnLabel = isGuard ? 'Done / Return to Guard Portal' : (isAdmin ? 'Done / Return to Dashboard' : 'Done / Return Home');

  const [registrationCode, setRegistrationCode] = useState('');
  const [passToken, setPassToken] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [hostName, setHostName] = useState('');
  const [department, setDepartment] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitorType, setVisitorType] = useState('Official');
  const [status, setStatus] = useState('APPROVED');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    const code = searchParams.get('code') || '';
    const token = searchParams.get('token') || code;
    const name = searchParams.get('name') || '';
    const host = searchParams.get('host') || '';
    const dept = searchParams.get('dept') || '';
    const org = searchParams.get('org') || '';
    const purpose = searchParams.get('purpose') || '';
    const type = searchParams.get('type') || 'Official';
    const st = searchParams.get('status') || 'APPROVED';

    if (code) {
      setRegistrationCode(code);
    }
    if (token) {
      setPassToken(token);
    }
    if (name) setParticipantName(decodeURIComponent(name));
    if (host) setHostName(decodeURIComponent(host));
    if (dept) setDepartment(decodeURIComponent(dept));
    if (org) setOrganisation(decodeURIComponent(org));
    if (purpose) setVisitPurpose(decodeURIComponent(purpose));
    if (type) setVisitorType(decodeURIComponent(type));
    if (st) setStatus(st.toUpperCase());

    const qrPayload = token || code;
    if (qrPayload) {
      QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 1,
        color: {
          dark: '#152d56',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [searchParams]);

  const handleCopyCode = async () => {
    if (!registrationCode) return;
    try {
      await navigator.clipboard.writeText(registrationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `pcc-pass-${registrationCode || 'code'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPending = status === 'PENDING';

  return (
    <div 
      className="min-h-screen bg-[#FAF8F4] py-8 px-4 sm:px-6 flex flex-col justify-between"
      style={{ backgroundColor: '#FAF8F4', color: '#152420' }}
    >
      <div className="max-w-md mx-auto w-full">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <Link
            href={returnHref}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1E36] hover:bg-slate-100 transition-colors py-1.5 px-3 rounded-full bg-white border border-slate-300 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isGuard ? 'Guard Portal' : (isAdmin ? 'Admin Dashboard' : 'Main Entrance')}</span>
          </Link>
        </div>

        {/* Success Alert Header */}
        <div className="text-center mb-5 print:hidden">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 mx-auto flex items-center justify-center mb-2 shadow-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="font-fraunces font-semibold text-2xl text-[#152420] tracking-tight">
            Check-in Confirmed
          </h1>
          <p className="text-xs sm:text-sm text-[#556960] mt-1 max-w-sm mx-auto">
            Your entry has been authorised upon host confirmation. Keep this pass during your stay on PCC grounds.
          </p>
        </div>

        {/* Digital Visitor Credential Badge Card */}
        <div
          ref={cardRef}
          className="rounded-3xl bg-[#1a3a6e] text-white p-6 sm:p-7 shadow-xl shadow-black/15 relative overflow-hidden border border-[#C89B3C]/40 mb-6 print:shadow-none print:border-black print:text-black print:bg-white"
        >
          {/* Watermark background emblem */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 opacity-10 pointer-events-none rounded-full border-8 border-white" />

          {/* Top Pass Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/15">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs">
                <img src="/pcc.png" alt="PCC" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#C89B3C]">
                  Pentecost Convention Centre
                </p>
                <p className="text-xs text-white/80 font-medium">Visitor Access Pass</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-emerald-400/20 border border-emerald-400/50 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
              <span>Active Access Pass</span>
            </div>
          </div>

          {/* Pass Number Section */}
          <div className="text-center py-4">
            <p className="text-[11px] uppercase tracking-widest text-[#C89B3C] font-semibold mb-1">
              Visitor Pass Number
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono font-bold text-3xl sm:text-4xl tracking-wider text-white">
                {registrationCode || 'PCC-V......'}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy Pass Number"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white/90 print:hidden min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Scannable Pass QR Code */}
          <div className="bg-white rounded-2xl p-4 mx-auto max-w-[190px] shadow-md border border-white/20 text-center mb-5">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt={`QR code for ${registrationCode}`}
                className="w-full h-auto mx-auto aspect-square object-contain"
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-stone-100 rounded-lg">
                <span className="text-xs text-stone-400">Generating QR...</span>
              </div>
            )}
            <p className="text-[9.5px] text-stone-500 font-bold tracking-wider mt-1 uppercase">
              Present At Gate Reader
            </p>
            <p className="text-[8.5px] text-stone-400 font-semibold tracking-tight">
              128-bit Cryptographic Token
            </p>
          </div>

          {/* Visitor Details Block */}
          <div className="bg-black/20 rounded-2xl p-4 space-y-2 text-xs border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-white/60 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#C89B3C]" /> Visitor Name
              </span>
              <span className="font-semibold text-white">{participantName || 'Guest'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" /> Category
              </span>
              <span className="font-semibold text-amber-300">{visitorType}</span>
            </div>
            {organisation && (
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#C89B3C]" /> Organisation
                </span>
                <span className="font-semibold text-white truncate max-w-[55%] text-right">{organisation}</span>
              </div>
            )}
            {hostName && (
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#C89B3C]" /> Visiting Host
                </span>
                <span className="font-semibold text-white">{hostName}</span>
              </div>
            )}
            {department && (
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#C89B3C]" /> Department
                </span>
                <span className="font-semibold text-white">{department}</span>
              </div>
            )}
            {visitPurpose && (
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C89B3C]" /> Purpose
                </span>
                <span className="font-semibold text-white truncate max-w-[55%] text-right">{visitPurpose}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <span className="text-white/60 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C89B3C]" /> Issue Date
              </span>
              <span className="font-semibold text-white">{todayFormatted}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 print:hidden">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="py-3.5 px-4 rounded-xl bg-white border border-stone-200 text-[#152420] font-semibold text-xs sm:text-sm hover:bg-stone-50 transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4 text-[#1a3a6e]" />
              <span>Print Pass</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="py-3.5 px-4 rounded-xl bg-white border border-stone-200 text-[#152420] font-semibold text-xs sm:text-sm hover:bg-stone-50 transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4 text-[#1a3a6e]" />
              <span>Save QR Image</span>
            </button>
          </div>

          <Link
            href={returnHref}
            className="w-full py-4 px-4 rounded-xl bg-[#0B1E36] text-white font-bold text-xs sm:text-sm hover:bg-[#071526] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Home className="w-4 h-4 text-amber-300" />
            <span>{returnLabel}</span>
          </Link>
        </div>
      </div>

      <footer className="text-center text-[11px] text-[#556960] mt-6 print:hidden">
        Keep your visitor pass number ready for entry and departure check-out.
      </footer>
    </div>
  );
}

export default function RegistrationSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a3a6e]"></div>
        </div>
      }
    >
      <RegistrationSuccessContent />
    </Suspense>
  );
}
