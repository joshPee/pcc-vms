'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

function RegistrationSuccessContent() {
  const searchParams = useSearchParams();
  const [registrationCode, setRegistrationCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [hostName, setHostName] = useState('');
  const [department, setDepartment] = useState('');
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
    const name = searchParams.get('name') || '';
    const host = searchParams.get('host') || '';
    const dept = searchParams.get('dept') || '';

    if (code) setRegistrationCode(code);
    if (name) setParticipantName(decodeURIComponent(name));
    if (host) setHostName(decodeURIComponent(host));
    if (dept) setDepartment(decodeURIComponent(dept));

    if (code) {
      QRCode.toDataURL(code, {
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

  return (
    <div className="min-h-screen bg-[#FAF8F4] py-8 px-4 sm:px-6 flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full">
        {/* Success Alert Header */}
        <div className="text-center mb-6 print:hidden">
          <div className="w-12 h-12 rounded-full bg-[#1a3a6e]/10 border border-[#1a3a6e]/20 text-[#1a3a6e] mx-auto flex items-center justify-center mb-2.5 shadow-xs">
            <CheckCircle2 className="w-6 h-6 text-[#1a3a6e]" />
          </div>
          <h1 className="font-fraunces font-semibold text-2xl text-[#152420] tracking-tight">
            Check-in Confirmed
          </h1>
          <p className="text-xs sm:text-sm text-[#556960] mt-0.5">
            Present this pass to security at the gate for fast entry
          </p>
        </div>

        {/* Digital Visitor Credential Badge Card */}
        <div
          ref={cardRef}
          className="rounded-3xl bg-[#1a3a6e] text-white p-6 sm:p-7 shadow-xl shadow-black/15 relative overflow-hidden border border-[#C89B3C]/40 mb-6 print:shadow-none print:border-black print:text-black print:bg-white"
        >
          {/* Subtle watermark background emblem */}
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
                <p className="text-xs text-white/80 font-medium">Official Visitor Gate Pass</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-[#C89B3C]/20 border border-[#C89B3C]/40 px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#C89B3C] uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              <span>Valid</span>
            </div>
          </div>

          {/* Code Section */}
          <div className="text-center py-5">
            <p className="text-[11px] uppercase tracking-widest text-[#C89B3C] font-semibold mb-1">
              Registration Code
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono font-bold text-3xl sm:text-4xl tracking-wider text-white">
                {registrationCode || 'CTS-....'}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy Code"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white/90 print:hidden"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* High-res Scannable QR Code */}
          <div className="bg-white rounded-2xl p-4 mx-auto max-w-[200px] shadow-md border border-white/20 text-center mb-5">
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
            <p className="text-[10px] text-stone-500 font-semibold tracking-wider mt-1 uppercase">
              Scan at Gate Reader
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
            {hostName && (
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#C89B3C]" /> Visiting
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
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <span className="text-white/60 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C89B3C]" /> Date Issued
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
              <span>Save QR Code</span>
            </button>
          </div>

          <Link
            href="/"
            className="w-full py-3.5 px-4 rounded-xl bg-[#1a3a6e] text-white font-semibold text-xs sm:text-sm hover:bg-[#152d56] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Home className="w-4 h-4" />
            <span>Done · Return to Home</span>
          </Link>
        </div>
      </div>

      <footer className="text-center text-[11px] text-[#556960] mt-6 print:hidden">
        Please keep this code ready to present at the gate upon arrival and departure.
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

