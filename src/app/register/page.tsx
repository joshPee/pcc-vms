'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  MapPin,
  Building2,
  Car,
  FileText,
  AlertCircle,
  CheckCircle2,
  Shield,
  Loader2,
  CreditCard,
  BadgeCheck,
  X,
  Mic,
  MicOff,
  Sparkles,
} from 'lucide-react';

function formatGhanaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('233')) {
    const rest = digits.slice(3);
    if (rest.length <= 2) return `+233 ${rest}`;
    if (rest.length <= 5) return `+233 ${rest.slice(0, 2)} ${rest.slice(2)}`;
    return `+233 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 9)}`;
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
}

const COMMON_DEPARTMENTS = [
  'Administration',
  'Security & Safety',
  'Guest House / Hospitality',
  'Events & Conferences',
  'Finance & Accounts',
  'Maintenance / Estate',
  'Executive Office',
];

const PURPOSE_PRESETS = [
  'Official Meeting',
  'Event / Conference',
  'Guest House Check-in',
  'Contractor / Service',
  'Delivery / Courier',
  'Personal Visit',
];

const VISITOR_TYPES = [
  'Official',
  'Personal',
  'Contractor',
  'Guest',
  'Delivery',
  'VIP',
  'Other',
];

const ID_TYPES = [
  'Ghana Card',
  'Passport',
  'Voter ID',
  'Driver’s Licence',
  'Other ID',
];

export default function Register() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isGuard = session?.user?.role === 'security_officer' || session?.user?.role === 'supervisor';
  const isAdmin = session?.user?.role === 'admin';
  const backHref = isGuard ? '/guard' : (isAdmin ? '/admin/dashboard' : '/guard');
  const backLabel = isGuard ? 'Guard Portal' : (isAdmin ? 'Admin Dashboard' : 'Guard Portal');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/admin/login?callbackUrl=/register');
    }
  }, [status, router]);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [visitorType, setVisitorType] = useState('Official');
  
  // Optional ID fields (Strictly optional per Section 2 & 17)
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  
  const [personToVisit, setPersonToVisit] = useState('');
  const [department, setDepartment] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [vehicleRegistration, setVehicleRegistration] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Watchlist alert & returning visitor
  const [watchlistAlert, setWatchlistAlert] = useState<{
    reason?: string;
    description?: string;
    matchedName?: string;
    matchType?: string;
    confidence?: number;
  } | null>(null);
  const [overrideJustification, setOverrideJustification] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [returningVisitor, setReturningVisitor] = useState<{ visitCount: number; lastVisit?: string; lastHost?: string } | null>(null);

  // Voice dictation state
  const [isListeningName, setIsListeningName] = useState(false);
  const [isListeningPurpose, setIsListeningPurpose] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startVoiceInput = (targetField: 'fullName' | 'visitPurpose') => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      alert('Voice dictation is not supported on this browser. Please type directly.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-GH';

      if (targetField === 'fullName') setIsListeningName(true);
      if (targetField === 'visitPurpose') setIsListeningPurpose(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (targetField === 'fullName') {
          setFullName((prev) => (prev ? `${prev} ${transcript}` : transcript));
          validateField('fullName', transcript);
        } else if (targetField === 'visitPurpose') {
          setVisitPurpose((prev) => (prev ? `${prev} ${transcript}` : transcript));
          validateField('visitPurpose', transcript);
        }
      };

      recognition.onerror = () => {
        setIsListeningName(false);
        setIsListeningPurpose(false);
      };

      recognition.onend = () => {
        setIsListeningName(false);
        setIsListeningPurpose(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListeningName(false);
      setIsListeningPurpose(false);
    }
  };

  const validateField = (field: string, value: string) => {
    const errors: Record<string, string> = {};
    if (field === 'fullName' && value.length > 0 && value.length < 2) {
      errors.fullName = 'Name must be at least 2 characters';
    }
    if (field === 'phone' && value.length > 0 && value.length < 9) {
      errors.phone = 'Phone number must be at least 9 digits';
    }
    if (field === 'personToVisit' && value.length > 0 && value.length < 2) {
      errors.personToVisit = 'Please specify a valid person or office';
    }
    if (field === 'visitPurpose' && value.length > 0 && value.length < 2) {
      errors.visitPurpose = 'Purpose must be at least 2 characters';
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      if (errors[field]) {
        next[field] = errors[field];
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleNextStep = () => {
    setError('');
    if (!fullName || fullName.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters)');
      return;
    }
    if (!phone || phone.trim().length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousStep = () => {
    setError('');
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent, forceSubmit = false) => {
    e.preventDefault();
    setError('');
    setDuplicateWarning(false);

    if (!personToVisit || personToVisit.trim().length < 2) {
      setError('Please specify the person or office you are visiting');
      return;
    }
    if (!visitPurpose || visitPurpose.trim().length < 2) {
      setError('Please state the purpose of your visit');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          location: location.trim() || 'Accra / PCC',
          organisation: organisation.trim(),
          visitorType: visitorType.trim() || 'Official',
          idType: idType.trim() || null,
          idNumber: idNumber.trim() || null,
          personToVisit: personToVisit.trim(),
          department: department.trim() || 'General',
          visitPurpose: visitPurpose.trim(),
          vehicleRegistration: vehicleRegistration.trim().toUpperCase() || null,
          forceSubmit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.watchlistAlert) {
          setWatchlistAlert({
            reason: data.watchlistReason,
            description: data.watchlistDescription,
            matchedName: data.matchedName,
            matchType: data.matchType,
            confidence: data.confidence,
          });
          setShowOverrideInput(false);
          setOverrideJustification('');
          setError('');
        } else if (data.denied) {
          setWatchlistAlert(null);
          setShowOverrideInput(false);
          setError(data.error || 'Visitor entry has been denied per security policy.');
        } else if (data.duplicate) {
          setDuplicateWarning(true);
          setPendingSubmission(data);
          setError(data.error || 'A similar active registration was found for today.');
        } else {
          setError(data.error || 'Registration failed. Please check your details.');
        }
      } else {
        if (data.returning?.isReturning) {
          setReturningVisitor(data.returning);
          await new Promise((r) => setTimeout(r, 1800));
        }

        const passCode = data.passNumber || data.registrationCode;
        const queryParams = new URLSearchParams({
          code: passCode,
          name: data.fullName || fullName.trim(),
          host: personToVisit.trim(),
          dept: department.trim() || 'General',
          org: organisation.trim(),
          purpose: visitPurpose.trim(),
          type: visitorType,
          status: 'APPROVED',
          phone: phone.trim(),
          vehicle: vehicleRegistration.trim(),
        });
        router.push(`/register/success?${queryParams.toString()}`);
      }
    } catch {
      setError('Network error. Please verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlistDecision = async (decision: 'allow' | 'deny') => {
    if (decision === 'allow' && (!overrideJustification || overrideJustification.trim().length < 10)) {
      alert('Supervisor override requires a detailed justification (minimum 10 characters).');
      return;
    }

    setDecisionSubmitting(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          location: location.trim() || 'Accra / PCC',
          organisation: organisation.trim(),
          visitorType: visitorType.trim() || 'Official',
          idType: idType.trim() || null,
          idNumber: idNumber.trim() || null,
          personToVisit: personToVisit.trim(),
          department: department.trim() || 'General',
          visitPurpose: visitPurpose.trim(),
          vehicleRegistration: vehicleRegistration.trim().toUpperCase() || null,
          watchlistDecision: decision,
          watchlistJustification: decision === 'allow' ? overrideJustification.trim() : undefined,
          forceSubmit: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.denied) {
          setWatchlistAlert(null);
          setShowOverrideInput(false);
          setError(data.error || 'Visitor entry has been officially denied.');
        } else {
          alert(data.error || 'Action failed.');
        }
      } else {
        setWatchlistAlert(null);
        setShowOverrideInput(false);
        const passCode = data.passNumber || data.registrationCode;
        const queryParams = new URLSearchParams({
          code: passCode,
          name: data.fullName || fullName.trim(),
          host: personToVisit.trim(),
          dept: department.trim() || 'General',
          org: organisation.trim(),
          purpose: visitPurpose.trim(),
          type: visitorType,
          status: 'APPROVED',
          phone: phone.trim(),
          vehicle: vehicleRegistration.trim(),
        });
        router.push(`/register/success?${queryParams.toString()}`);
      }
    } catch {
      alert('Network error while processing security decision.');
    } finally {
      setDecisionSubmitting(false);
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#0B1E36] flex flex-col items-center justify-center text-white px-4">
        <div className="w-9 h-9 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
          {status === 'loading' ? 'Verifying guard station clearance...' : 'Redirecting to guard station login...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="w-full max-w-lg mx-auto">
        {/* Watchlist Security Alert Modal & Decision Flow */}
        {watchlistAlert && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#0B1E36] border-2 border-red-500 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-3 mb-4 text-red-400">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-wide text-white">WATCHLIST MATCH DETECTED</h2>
                  <p className="text-xs text-red-300 font-medium">Gate Security Protocol - Guard Action Required</p>
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-700 space-y-2 mb-4 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Visitor:</span>
                  <span className="font-bold text-white">{fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Matched Record:</span>
                  <span className="font-bold text-amber-300">{watchlistAlert.matchedName || 'Watchlist Entry'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Match Basis:</span>
                  <span className="font-bold uppercase text-red-400">
                    {watchlistAlert.matchType === 'both' ? 'Phone & Name' : watchlistAlert.matchType === 'phone' ? 'Phone Match' : 'Name Similarity'}
                    {watchlistAlert.confidence ? ` (${Math.round(watchlistAlert.confidence * 100)}%)` : ''}
                  </span>
                </div>
                <div className="flex flex-col pt-1">
                  <span className="text-slate-400 mb-0.5">Restriction Reason:</span>
                  <span className="font-semibold text-red-200">{watchlistAlert.reason || 'Restricted entry policy'}</span>
                  {watchlistAlert.description && (
                    <span className="text-[11px] text-slate-400 mt-1 italic">{watchlistAlert.description}</span>
                  )}
                </div>
              </div>

              {!showOverrideInput ? (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-300 text-center font-medium">
                    Do you want to refuse entry or initiate an authorized supervisor override?
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={decisionSubmitting}
                      onClick={() => handleWatchlistDecision('deny')}
                      className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {decisionSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Deny Entry'}
                    </button>
                    <button
                      type="button"
                      disabled={decisionSubmitting}
                      onClick={() => setShowOverrideInput(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      Supervisor Override
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWatchlistAlert(null)}
                    className="w-full py-2 text-center text-[11px] text-slate-400 hover:text-white transition"
                  >
                    Dismiss Alert
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-200">
                    <p className="font-bold">Supervisor Authorization</p>
                    <p className="text-[11px] text-amber-300/80">Type the reason and approving supervisor name. This is logged to the permanent audit trail.</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Justification (min. 10 chars) *
                    </label>
                    <textarea
                      value={overrideJustification}
                      onChange={(e) => setOverrideJustification(e.target.value)}
                      placeholder="e.g. Authorized by Shift Supervisor Osei after physical ID inspection..."
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOverrideInput(false)}
                      disabled={decisionSubmitting}
                      className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={decisionSubmitting || overrideJustification.trim().length < 10}
                      onClick={() => handleWatchlistDecision('allow')}
                      className="py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1"
                    >
                      {decisionSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm & Register'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Returning Visitor Banner */}
        {returningVisitor && (
          <div className="mb-4 bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">Welcome Back</p>
              <p className="text-xs text-amber-800 mt-0.5">
                {returningVisitor.visitCount} previous visit{returningVisitor.visitCount !== 1 ? 's' : ''} on record.
                {returningVisitor.lastHost ? ` Last visited: ${returningVisitor.lastHost}.` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1E36] hover:bg-slate-100 transition-colors py-1.5 px-3 rounded-full bg-white border border-slate-300 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#0B1E36] font-semibold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80">
            <Shield className="w-3 h-3 text-[#0B1E36]" />
            <span>{isGuard ? 'Guard Station Check-In' : 'Visitor Self-Registration'}</span>
          </div>
        </div>

        {/* Header Banner */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-1">
            <img src="/pcc.png" alt="PCC Logo" className="object-contain w-full h-full" />
          </div>
          <h1 className="font-fraunces font-semibold text-2xl sm:text-3xl text-[#152420] tracking-tight">
            Visitor Registration
          </h1>
          <p className="text-xs sm:text-sm text-[#556960] mt-1">
            Pentecost Convention Centre · Main Gate Checkpoint
          </p>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-4 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  currentStep === 1 ? 'bg-[#1a3a6e] text-white shadow-xs' : 'bg-[#1a3a6e]/15 text-[#1a3a6e]'
                }`}
              >
                {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </span>
              <div>
                <p className="text-xs font-bold text-[#152420]">Visitor Details</p>
                <p className="text-[11px] text-[#556960]">Name, Contact & ID</p>
              </div>
            </div>

            <div className="w-12 sm:w-16 h-0.5 bg-stone-200 mx-2">
              <div
                className="h-full bg-[#1a3a6e] transition-all duration-300"
                style={{ width: currentStep === 2 ? '100%' : '0%' }}
              />
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  currentStep === 2 ? 'bg-[#1a3a6e] text-white shadow-xs' : 'bg-stone-100 text-stone-400'
                }`}
              >
                2
              </span>
              <div>
                <p className={`text-xs font-bold ${currentStep === 2 ? 'text-[#152420]' : 'text-stone-400'}`}>
                  Visit & Host Info
                </p>
                <p className="text-[11px] text-[#556960]">Purpose & Destination</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-md p-5 sm:p-7 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-2xl flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-[#1a3a6e] animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-[#152420]">Submitting your registration...</p>
                <p className="text-xs text-[#556960] mt-1">Generating your official PCC visitor pass number</p>
              </div>
            </div>
          )}

          {error && !duplicateWarning && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {duplicateWarning && (
            <div className="mb-5 p-4 rounded-xl bg-[#FAF3E0] border border-[#C89B3C]/50 text-[#152420] text-xs sm:text-sm">
              <div className="flex items-start gap-2.5 mb-3">
                <AlertCircle className="w-4 h-4 text-[#C89B3C] shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                {pendingSubmission?.existingCode && (
                  <Link
                    href={`/register/success?code=${pendingSubmission.existingCode}&name=${encodeURIComponent(
                      pendingSubmission.fullName || fullName
                    )}`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#1a3a6e] text-white font-medium text-xs text-center hover:bg-[#152d56]"
                  >
                    View Existing Pass
                  </Link>
                )}
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#C89B3C] text-[#152d56] font-bold text-xs"
                >
                  Submit Anyway
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={
              currentStep === 1
                ? (e) => {
                    e.preventDefault();
                    handleNextStep();
                  }
                : handleSubmit
            }
            className="space-y-4"
          >
            {currentStep === 1 ? (
              <>
                {/* Full Name */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="fullName" className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider">
                      <User className="w-3.5 h-3.5 text-[#1a3a6e]" />
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => startVoiceInput('fullName')}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition ${
                        isListeningName
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                      title="Speak your name"
                    >
                      {isListeningName ? <MicOff className="w-3 h-3 text-rose-600" /> : <Mic className="w-3 h-3 text-[#1a3a6e]" />}
                      <span>{isListeningName ? 'Listening...' : 'Dictate'}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        validateField('fullName', e.target.value);
                      }}
                      placeholder="e.g. Samuel Kofi Mensah"
                      className="w-full min-h-[52px] px-4 pr-10 rounded-2xl border border-stone-200 bg-stone-50/70 text-[#152420] text-sm sm:text-base focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#1a3a6e]/15 focus:border-[#1a3a6e] transition-all"
                    />
                    {fullName && (
                      <button
                        type="button"
                        onClick={() => {
                          setFullName('');
                          validateField('fullName', '');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {fieldErrors.fullName && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="phone" className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider">
                      <Phone className="w-3.5 h-3.5 text-[#1a3a6e]" />
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10.5px] text-stone-400">Ghana (024 / 055...)</span>
                  </div>

                  <div className="relative">
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        const formatted = formatGhanaPhone(e.target.value);
                        setPhone(formatted);
                        validateField('phone', formatted);
                      }}
                      placeholder="e.g. 024 123 4567"
                      className="w-full min-h-[52px] px-4 pr-10 rounded-2xl border border-stone-200 bg-stone-50/70 text-[#152420] text-sm sm:text-base font-mono tracking-wide focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#1a3a6e]/15 focus:border-[#1a3a6e] transition-all"
                    />
                    {phone && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhone('');
                          validateField('phone', '');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {fieldErrors.phone}
                    </p>
                  )}
                </div>

                {/* Location / Coming From */}
                <div>
                  <label htmlFor="location" className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Coming From / Town <span className="text-stone-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Kasoa, Accra, Kumasi"
                      className="w-full min-h-[52px] px-4 pr-10 rounded-2xl border border-stone-200 bg-stone-50/70 text-[#152420] text-sm focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#1a3a6e]/15 focus:border-[#1a3a6e] transition-all"
                    />
                    {location && (
                      <button
                        type="button"
                        onClick={() => setLocation('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Organisation */}
                <div>
                  <label htmlFor="organisation" className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Organization / Company <span className="text-stone-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="organisation"
                      type="text"
                      value={organisation}
                      onChange={(e) => setOrganisation(e.target.value)}
                      placeholder="e.g. PIWC Atomic, Contractor Co, or Self"
                      className="w-full min-h-[52px] px-4 pr-10 rounded-2xl border border-stone-200 bg-stone-50/70 text-[#152420] text-sm focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#1a3a6e]/15 focus:border-[#1a3a6e] transition-all"
                    />
                    {organisation && (
                      <button
                        type="button"
                        onClick={() => setOrganisation('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Optional Identification Details (Section 2 & 17) */}
                <div className="pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider">
                      <CreditCard className="w-3.5 h-3.5 text-[#1a3a6e]" />
                      ID Details <span className="text-stone-400 font-normal lowercase">(optional)</span>
                    </label>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full font-medium">
                      Not mandatory
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full min-h-[48px] px-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#1a3a6e]/15 focus:border-[#1a3a6e] transition-all"
                    >
                      <option value="">Select ID Type (Optional)</option>
                      {ID_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="ID Number (e.g. GHA-...)"
                      className="w-full min-h-[48px] px-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#1a3a6e]/15 focus:border-[#1a3a6e] transition-all"
                    />
                  </div>
                  <p className="text-[10.5px] text-stone-400 mt-1.5">
                    Providing an ID is completely optional. You can proceed without it.
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full min-h-[54px] py-4 rounded-2xl text-white font-bold text-sm sm:text-base bg-[#1a3a6e] hover:bg-[#152d56] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1a3a6e]/20 hover:shadow-xl"
                  >
                    <span>Proceed to Visit Details</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Visitor Type Selector */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Visitor Category <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {VISITOR_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setVisitorType(type)}
                        className={`text-[11px] py-1.5 px-3 rounded-lg border transition-all ${
                          visitorType === type
                            ? 'bg-[#1a3a6e] text-white border-[#1a3a6e] shadow-xs font-bold'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Person to Visit */}
                <div>
                  <label htmlFor="personToVisit" className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5">
                    <User className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Person or Office to Visit <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="personToVisit"
                      type="text"
                      required
                      value={personToVisit}
                      onChange={(e) => {
                        setPersonToVisit(e.target.value);
                        validateField('personToVisit', e.target.value);
                      }}
                      placeholder="e.g. Centre Manager, Rev. Osei, Guest House"
                      className="w-full min-h-[52px] px-4 pr-10 rounded-2xl border border-stone-200 bg-stone-50/70 text-[#152420] text-sm sm:text-base focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#1a3a6e]/15 focus:border-[#1a3a6e] transition-all"
                    />
                    {personToVisit && (
                      <button
                        type="button"
                        onClick={() => {
                          setPersonToVisit('');
                          validateField('personToVisit', '');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {fieldErrors.personToVisit && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {fieldErrors.personToVisit}
                    </p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="department" className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Department <span className="text-stone-400 font-normal lowercase">(recommended)</span>
                  </label>
                  <div className="relative mb-2">
                    <input
                      id="department"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Type or select a department below"
                      className="w-full min-h-[52px] px-4 pr-10 rounded-2xl border border-stone-200 bg-stone-50/70 text-[#152420] text-sm sm:text-base focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#1a3a6e]/15 focus:border-[#1a3a6e] transition-all"
                    />
                    {department && (
                      <button
                        type="button"
                        onClick={() => setDepartment('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_DEPARTMENTS.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => setDepartment(dept)}
                        className={`text-[11px] py-1.5 px-3 rounded-xl border transition-all ${
                          department === dept
                            ? 'bg-[#1a3a6e] text-white border-[#1a3a6e] font-bold shadow-xs'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 active:scale-[0.98]'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purpose of Visit */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="visitPurpose" className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider">
                      <FileText className="w-3.5 h-3.5 text-[#1a3a6e]" />
                      Purpose of Visit <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => startVoiceInput('visitPurpose')}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition ${
                        isListeningPurpose
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                      title="Speak purpose of visit"
                    >
                      {isListeningPurpose ? <MicOff className="w-3 h-3 text-rose-600" /> : <Mic className="w-3 h-3 text-[#1a3a6e]" />}
                      <span>{isListeningPurpose ? 'Listening...' : 'Dictate'}</span>
                    </button>
                  </div>

                  <div className="relative mb-2">
                    <textarea
                      id="visitPurpose"
                      required
                      value={visitPurpose}
                      onChange={(e) => {
                        setVisitPurpose(e.target.value);
                        validateField('visitPurpose', e.target.value);
                      }}
                      rows={2}
                      placeholder="Briefly state reason for visit or pick a preset"
                      className="w-full min-h-[58px] px-4 py-3 pr-10 rounded-2xl border border-stone-200 bg-stone-50/70 text-[#152420] text-sm sm:text-base focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#1a3a6e]/15 focus:border-[#1a3a6e] transition-all resize-none"
                    />
                    {visitPurpose && (
                      <button
                        type="button"
                        onClick={() => {
                          setVisitPurpose('');
                          validateField('visitPurpose', '');
                        }}
                        className="absolute right-3 top-3 p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PURPOSE_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setVisitPurpose(p)}
                        className={`text-[11px] py-1.5 px-3 rounded-xl border transition-all ${
                          visitPurpose === p
                            ? 'bg-[#1a3a6e] text-white border-[#1a3a6e] font-bold shadow-xs'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 active:scale-[0.98]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.visitPurpose && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {fieldErrors.visitPurpose}
                    </p>
                  )}
                </div>

                {/* Vehicle Registration */}
                <div>
                  <label htmlFor="vehicleRegistration" className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5">
                    <Car className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Vehicle Registration Plate <span className="text-stone-400 font-normal lowercase">(if driving)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="vehicleRegistration"
                      type="text"
                      value={vehicleRegistration}
                      onChange={(e) => setVehicleRegistration(e.target.value.toUpperCase())}
                      placeholder="e.g. GW 4821 - 22"
                      className="w-full min-h-[52px] px-4 pr-10 rounded-2xl border border-stone-200 bg-stone-50/70 text-[#152420] text-sm uppercase font-mono tracking-wider focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#1a3a6e]/15 focus:border-[#1a3a6e] transition-all"
                    />
                    {vehicleRegistration && (
                      <button
                        type="button"
                        onClick={() => setVehicleRegistration('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notice: Instant Pass Issuance */}
                <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/90 text-[11px] sm:text-xs text-emerald-900 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Entry Notice:</strong> Submitting will immediately generate and dispense your official PCC Visitor Gate Pass. Please keep this pass with you at all times on the grounds.
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="min-h-[54px] py-4 px-6 rounded-2xl text-stone-700 bg-stone-100 hover:bg-stone-200 font-bold text-sm transition active:scale-[0.98]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 min-h-[54px] py-4 rounded-2xl text-white font-bold text-sm sm:text-base bg-[#1a3a6e] hover:bg-[#152d56] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1a3a6e]/20 hover:shadow-xl disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span>Generating Gate Pass...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Registration</span>
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-[#556960] mt-6">
          Pentecost Convention Centre · Gomoa Yesukrom · Visitor Management System
        </p>
      </div>
    </div>
  );
}
