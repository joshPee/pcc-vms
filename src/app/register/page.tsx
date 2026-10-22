'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';

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

export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [organisation, setOrganisation] = useState('');
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
  // Feature 1: Watchlist alert
  const [watchlistAlert, setWatchlistAlert] = useState<{ reason?: string; description?: string } | null>(null);
  // Feature 5: Returning visitor
  const [returningVisitor, setReturningVisitor] = useState<{ visitCount: number; lastVisit?: string; lastHost?: string } | null>(null);

  const validateField = (field: string, value: string) => {
    const errors: Record<string, string> = {};
    
    if (field === 'fullName' && value.length > 0 && value.length < 2) {
      errors.fullName = 'Name must be at least 2 characters';
    }
    if (field === 'phone' && value.length > 0 && value.length < 9) {
      errors.phone = 'Phone number must be at least 9 digits';
    }
    if (field === 'location' && value.length > 0 && value.length < 2) {
      errors.location = 'Location must be at least 2 characters';
    }
    if (field === 'personToVisit' && value.length > 0 && value.length < 2) {
      errors.personToVisit = 'Please specify a valid person or office';
    }
    if (field === 'department' && value.length > 0 && value.length < 2) {
      errors.department = 'Department must be at least 2 characters';
    }
    if (field === 'visitPurpose' && value.length > 0 && value.length < 2) {
      errors.visitPurpose = 'Purpose must be at least 2 characters';
    }
    
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (errors[field]) {
        newErrors[field] = errors[field];
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const handleNextStep = () => {
    setError('');

    // Validate step 1 fields
    if (!fullName || fullName.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters)');
      return;
    }
    if (!phone || phone.trim().length < 9) {
      setError('Please enter a valid phone number');
      return;
    }
    if (!location || location.trim().length < 2) {
      setError('Please specify where you are coming from');
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

    // Validate step 2 fields
    if (!personToVisit || personToVisit.trim().length < 2) {
      setError('Please specify the person or office you are visiting');
      return;
    }
    if (!department || department.trim().length < 2) {
      setError('Please select or specify the department');
      return;
    }
    if (!visitPurpose || visitPurpose.trim().length < 2) {
      setError('Please state the purpose of your visit');
      return;
    }

    setLoading(true);
    setPendingSubmission({
      fullName,
      phone,
      location,
      organisation,
      personToVisit,
      department,
      visitPurpose,
      vehicleRegistration,
    });

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          location: location.trim(),
          organisation: organisation.trim(),
          personToVisit: personToVisit.trim(),
          department: department.trim(),
          visitPurpose: visitPurpose.trim(),
          vehicleRegistration: vehicleRegistration.trim().toUpperCase(),
          forceSubmit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.watchlistAlert) {
          // Feature 1: Block check-in, show security alert
          setWatchlistAlert({ reason: data.watchlistReason, description: data.watchlistDescription });
          setError('');
        } else if (data.duplicate) {
          setDuplicateWarning(true);
          setPendingSubmission(data);
          setError('A similar active registration was found for today. Submit anyway?');
        } else {
          setError(data.error || 'Registration failed. Please check your details.');
        }
      } else {
        // Feature 5: Show returning visitor banner before redirecting
        if (data.returning?.isReturning) {
          setReturningVisitor(data.returning);
          // Brief pause so guard sees the banner
          await new Promise((r) => setTimeout(r, 2200));
        }
        // Feature 4: Pass org & purpose to success page for richer visitor pass
        router.push(
          `/register/success?code=${data.registrationCode}&name=${encodeURIComponent(
            data.fullName
          )}&host=${encodeURIComponent(personToVisit)}&dept=${encodeURIComponent(
            department
          )}&org=${encodeURIComponent(organisation.trim())}&purpose=${encodeURIComponent(visitPurpose.trim())}`
        );
      }
    } catch (err) {
      setError('Network error. Please verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e, true);
  };

  const handleViewExisting = () => {
    if (pendingSubmission?.existingCode) {
      router.push(
        `/register/success?code=${pendingSubmission.existingCode}&name=${encodeURIComponent(
          pendingSubmission.fullName || fullName
        )}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="w-full max-w-lg mx-auto">

        {/* Feature 1: Watchlist Security Alert — blocks entire screen */}
        {watchlistAlert && (
          <div className="fixed inset-0 z-50 bg-red-950/95 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-4 animate-pulse">
              <AlertCircle className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">⚠ SECURITY ALERT</h2>
            <p className="text-red-200 text-sm font-semibold mb-1">This visitor is on the Security Watchlist</p>
            {watchlistAlert.reason && (
              <p className="text-red-300 text-xs mb-1">Reason: <span className="font-bold text-white">{watchlistAlert.reason}</span></p>
            )}
            {watchlistAlert.description && (
              <p className="text-red-300 text-xs mb-4">{watchlistAlert.description}</p>
            )}
            <p className="text-red-100 font-bold text-sm mb-6">Do NOT allow entry. Contact your supervisor immediately.</p>
            <button
              onClick={() => setWatchlistAlert(null)}
              className="px-6 py-3 rounded-xl bg-white text-red-900 font-extrabold text-sm hover:bg-red-50 transition"
            >
              Dismiss & Return to Form
            </button>
          </div>
        )}

        {/* Feature 5: Returning Visitor Banner */}
        {returningVisitor && (
          <div className="mb-4 bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">Returning Visitor</p>
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
            href="/guard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1E36] hover:bg-slate-100 transition-colors py-1.5 px-3 rounded-full bg-white border border-slate-300 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Guard Dashboard</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#0B1E36] font-semibold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80">
            <Shield className="w-3 h-3 text-[#0B1E36]" />
            <span>Gate Check-In</span>
          </div>
        </div>

        {/* Header Banner */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-1">
            <img
              src="/pcc.png"
              alt="PCC Logo"
              className="object-contain w-full h-full"
            />
          </div>
          <h1 className="font-fraunces font-semibold text-2xl sm:text-3xl text-[#152420] tracking-tight">
            Visitor Check-in
          </h1>
          <p className="text-xs sm:text-sm text-[#556960] mt-1">
            Pentecost Convention Centre · Gomoa Yesukrom
          </p>
        </div>

        {/* Step Progression Bar */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-4 sm:p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  currentStep === 1
                    ? 'bg-[#1a3a6e] text-white shadow-xs'
                    : 'bg-[#1a3a6e]/15 text-[#1a3a6e]'
                }`}
              >
                {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </span>
              <div>
                <p className="text-xs font-bold text-[#152420]">Personal Details</p>
                <p className="text-[11px] text-[#556960]">Your contact details</p>
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
                  currentStep === 2
                    ? 'bg-[#1a3a6e] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-400'
                }`}
              >
                2
              </span>
              <div>
                <p
                  className={`text-xs font-bold ${
                    currentStep === 2 ? 'text-[#152420]' : 'text-stone-400'
                  }`}
                >
                  Visit Details
                </p>
                <p className="text-[11px] text-[#556960]">Host & destination</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-md p-5 sm:p-7 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-[#1a3a6e] animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-[#152420]">Processing your registration...</p>
                <p className="text-xs text-[#556960] mt-1">Please wait while we generate your gate pass</p>
              </div>
            </div>
          )}
          {error && !duplicateWarning && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {duplicateWarning && (
            <div className="mb-5 p-4 rounded-xl bg-[#FAF3E0] border border-[#C89B3C]/50 text-[#152420] text-xs sm:text-sm animate-in fade-in">
              <div className="flex items-start gap-2.5 mb-3">
                <AlertCircle className="w-4 h-4 text-[#C89B3C] shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                {pendingSubmission?.existingCode && (
                  <button
                    type="button"
                    onClick={handleViewExisting}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#1a3a6e] text-white font-medium text-xs hover:bg-[#152d56] transition-all"
                  >
                    View Existing Pass
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleForceSubmit}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#C89B3C] text-[#152d56] font-semibold text-xs hover:brightness-105 transition-all"
                >
                  Confirm & Register Again
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateWarning(false);
                    setError('');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-stone-100 text-stone-700 font-medium text-xs hover:bg-stone-200 transition-all"
                >
                  Cancel
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
                  <label
                    htmlFor="fullName"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      validateField('fullName', e.target.value);
                    }}
                    onBlur={() => validateField('fullName', fullName)}
                    aria-label="Full name"
                    aria-required="true"
                    aria-invalid={fieldErrors.fullName ? 'true' : 'false'}
                    aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                    inputMode="text"
                    autoCapitalize="words"
                    autoComplete="name"
                    className="w-full px-4 py-3.5 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#1a3a6e] focus:border-transparent transition-all placeholder:text-stone-400"
                    placeholder="e.g. Samuel Kofi Mensah"
                    style={{ backgroundColor: '#F9FAFB', color: '#152420' }}
                  />
                  {fieldErrors.fullName && (
                    <p id="fullName-error" className="text-red-600 text-xs mt-1.5 flex items-center gap-1.5" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      validateField('phone', e.target.value);
                    }}
                    onBlur={() => validateField('phone', phone)}
                    aria-label="Phone number"
                    aria-required="true"
                    aria-invalid={fieldErrors.phone ? 'true' : 'false'}
                    aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                    inputMode="tel"
                    autoComplete="tel"
                    className="w-full px-4 py-3.5 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#1a3a6e] focus:border-transparent transition-all placeholder:text-stone-400"
                    placeholder="e.g. 024 123 4567"
                  />
                  {fieldErrors.phone && (
                    <p id="phone-error" className="text-red-600 text-xs mt-1.5 flex items-center gap-1.5" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Coming From / Town <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="location"
                    type="text"
                    required
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      validateField('location', e.target.value);
                    }}
                    onBlur={() => validateField('location', location)}
                    aria-label="Location or town you are coming from"
                    aria-required="true"
                    aria-invalid={fieldErrors.location ? 'true' : 'false'}
                    aria-describedby={fieldErrors.location ? 'location-error' : undefined}
                    inputMode="text"
                    autoCapitalize="words"
                    className="w-full px-4 py-3.5 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#1a3a6e] focus:border-transparent transition-all placeholder:text-stone-400"
                    placeholder="e.g. Kasoa, Accra, Kumasi"
                  />
                  {fieldErrors.location && (
                    <p id="location-error" className="text-red-600 text-xs mt-1.5 flex items-center gap-1.5" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.location}
                    </p>
                  )}
                </div>

                {/* Organisation */}
                <div>
                  <label
                    htmlFor="organisation"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Organization / Company{' '}
                    <span className="text-stone-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    id="organisation"
                    type="text"
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                    aria-label="Organization or company name"
                    inputMode="text"
                    autoCapitalize="words"
                    autoComplete="organization"
                    className="w-full px-4 py-3.5 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#1a3a6e] focus:border-transparent transition-all placeholder:text-stone-400"
                    placeholder="e.g. PIWC Atomic, Contractor Co, or Self"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 sm:py-4.5 min-h-[48px] rounded-xl text-white font-semibold text-sm sm:text-base bg-[#1a3a6e] hover:bg-[#152d56] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    <span>Proceed to Visit Details</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Person to Visit */}
                <div>
                  <label
                    htmlFor="personToVisit"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Person or Office to Visit <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="personToVisit"
                    type="text"
                    required
                    value={personToVisit}
                    onChange={(e) => {
                      setPersonToVisit(e.target.value);
                      validateField('personToVisit', e.target.value);
                    }}
                    onBlur={() => validateField('personToVisit', personToVisit)}
                    aria-label="Person or office you are visiting"
                    aria-required="true"
                    aria-invalid={fieldErrors.personToVisit ? 'true' : 'false'}
                    aria-describedby={fieldErrors.personToVisit ? 'personToVisit-error' : undefined}
                    inputMode="text"
                    autoCapitalize="words"
                    className="w-full px-4 py-3.5 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#1a3a6e] focus:border-transparent transition-all placeholder:text-stone-400"
                    placeholder="e.g. Centre Manager, Rev. Osei, or Guest House"
                  />
                  {fieldErrors.personToVisit && (
                    <p id="personToVisit-error" className="text-red-600 text-xs mt-1.5 flex items-center gap-1.5" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.personToVisit}
                    </p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label
                    htmlFor="department"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="department"
                    type="text"
                    required
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      validateField('department', e.target.value);
                    }}
                    onBlur={() => validateField('department', department)}
                    aria-label="Department you are visiting"
                    aria-required="true"
                    aria-invalid={fieldErrors.department ? 'true' : 'false'}
                    aria-describedby={fieldErrors.department ? 'department-error' : undefined}
                    inputMode="text"
                    autoCapitalize="words"
                    className="w-full px-4 py-3.5 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#1a3a6e] focus:border-transparent transition-all placeholder:text-stone-400 mb-2"
                    placeholder="Type or tap a suggestion below"
                  />
                  {fieldErrors.department && (
                    <p id="department-error" className="text-red-600 text-xs mb-2 flex items-center gap-1.5" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.department}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Department suggestions">
                    {COMMON_DEPARTMENTS.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => setDepartment(dept)}
                        aria-pressed={department === dept}
                        className={`text-[11px] py-1.5 px-3 min-h-[36px] rounded-lg border transition-all flex items-center gap-1.5 ${
                          department === dept
                            ? 'bg-[#1a3a6e] text-white border-[#1a3a6e] shadow-md'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {department === dept && <CheckCircle2 className="w-3 h-3" aria-hidden="true" />}
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purpose of Visit */}
                <div>
                  <label
                    htmlFor="visitPurpose"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Purpose of Visit <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="visitPurpose"
                    required
                    value={visitPurpose}
                    onChange={(e) => {
                      setVisitPurpose(e.target.value);
                      validateField('visitPurpose', e.target.value);
                    }}
                    onBlur={() => validateField('visitPurpose', visitPurpose)}
                    rows={2}
                    aria-label="Purpose of your visit"
                    aria-required="true"
                    aria-invalid={fieldErrors.visitPurpose ? 'true' : 'false'}
                    aria-describedby={fieldErrors.visitPurpose ? 'visitPurpose-error' : undefined}
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#1a3a6e] focus:border-transparent transition-all placeholder:text-stone-400 mb-2 resize-none"
                    placeholder="Briefly state the reason for your visit"
                  />
                  {fieldErrors.visitPurpose && (
                    <p id="visitPurpose-error" className="text-red-600 text-xs mb-2 flex items-center gap-1.5" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.visitPurpose}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Purpose of visit suggestions">
                    {PURPOSE_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setVisitPurpose(p)}
                        aria-pressed={visitPurpose === p}
                        className={`text-[11px] py-1.5 px-3 min-h-[36px] rounded-lg border transition-all flex items-center gap-1.5 ${
                          visitPurpose === p
                            ? 'bg-[#1a3a6e] text-white border-[#1a3a6e] shadow-md'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {visitPurpose === p && <CheckCircle2 className="w-3 h-3" aria-hidden="true" />}
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vehicle Registration */}
                <div>
                  <label
                    htmlFor="vehicleRegistration"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5"
                  >
                    <Car className="w-3.5 h-3.5 text-[#1a3a6e]" />
                    Vehicle Registration Plate{' '}
                    <span className="text-stone-400 font-normal lowercase">(if driving)</span>
                  </label>
                  <input
                    id="vehicleRegistration"
                    type="text"
                    value={vehicleRegistration}
                    onChange={(e) => setVehicleRegistration(e.target.value.toUpperCase())}
                    aria-label="Vehicle registration plate number"
                    inputMode="text"
                    autoCapitalize="characters"
                    className="w-full px-4 py-3.5 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm uppercase tracking-wider font-mono focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#1a3a6e] focus:border-transparent transition-all placeholder:normal-case placeholder:font-sans placeholder:text-stone-400"
                    placeholder="e.g. GW 4821 - 22"
                  />
                </div>

                {/* Form Navigation Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    aria-label="Go back to previous step"
                    className="py-4 px-5 min-h-[48px] rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200 font-medium text-sm transition-all flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    aria-label={loading ? 'Processing registration' : 'Complete check-in'}
                    className="flex-1 py-4 sm:py-4.5 min-h-[48px] rounded-xl text-white font-semibold text-sm sm:text-base bg-[#1a3a6e] hover:bg-[#152d56] disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Generating Gate Pass...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Check-in</span>
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#556960] mt-6">
          Pentecost Convention Centre · Gomoa Yesukrom · Visitor Management System
        </p>
      </div>
    </div>
  );
}


