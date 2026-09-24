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
        if (data.duplicate) {
          setDuplicateWarning(true);
          setPendingSubmission(data);
          setError('A similar active registration was found for today. Submit anyway?');
        } else {
          setError(data.error || 'Registration failed. Please check your details.');
        }
      } else {
        router.push(
          `/register/success?code=${data.registrationCode}&name=${encodeURIComponent(
            data.fullName
          )}&host=${encodeURIComponent(personToVisit)}&dept=${encodeURIComponent(
            department
          )}`
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
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="w-full max-w-lg mx-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#556960] hover:text-[#0B3D2E] transition-colors py-1.5 px-3 rounded-full bg-white/80 border border-stone-200/70 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#0B3D2E] font-medium bg-[#0B3D2E]/8 px-2.5 py-1 rounded-full border border-[#0B3D2E]/15">
            <Shield className="w-3 h-3 text-[#0B3D2E]" />
            <span>Gate Registration</span>
          </div>
        </div>

        {/* Header Banner */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-2xl bg-white border border-[#E4EBDF] shadow-xs p-2 flex items-center justify-center">
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
            Pentecost Convention Centre · Gomoa Fetteh
          </p>
        </div>

        {/* Step Progression Bar */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-4 sm:p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  currentStep === 1
                    ? 'bg-[#0B3D2E] text-white shadow-xs'
                    : 'bg-[#0B3D2E]/15 text-[#0B3D2E]'
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
                className="h-full bg-[#0B3D2E] transition-all duration-300"
                style={{ width: currentStep === 2 ? '100%' : '0%' }}
              />
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  currentStep === 2
                    ? 'bg-[#0B3D2E] text-white shadow-xs'
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
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-md p-5 sm:p-7">
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
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#0B3D2E] text-white font-medium text-xs hover:bg-[#082C21] transition-all"
                  >
                    View Existing Pass
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleForceSubmit}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#C89B3C] text-[#082C21] font-semibold text-xs hover:brightness-105 transition-all"
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
                    <User className="w-3.5 h-3.5 text-[#0B3D2E]" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent transition-all placeholder:text-stone-400"
                    placeholder="e.g. Samuel Kofi Mensah"
                    autoComplete="name"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#0B3D2E]" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent transition-all placeholder:text-stone-400"
                    placeholder="e.g. 024 123 4567"
                    autoComplete="tel"
                  />
                  <p className="text-[11px] text-[#556960] mt-1">
                    Used to send gate pass updates and verify identity
                  </p>
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#0B3D2E]" />
                    Coming From / Town <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="location"
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent transition-all placeholder:text-stone-400"
                    placeholder="e.g. Kasoa, Accra, Kumasi"
                  />
                </div>

                {/* Organisation */}
                <div>
                  <label
                    htmlFor="organisation"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#0B3D2E]" />
                    Church Assembly / Organization{' '}
                    <span className="text-stone-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    id="organisation"
                    type="text"
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent transition-all placeholder:text-stone-400"
                    placeholder="e.g. PIWC Atomic, Contractor Co, or Self"
                    autoComplete="organization"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 sm:py-4 rounded-xl text-white font-semibold text-sm sm:text-base bg-[#0B3D2E] hover:bg-[#082C21] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    <span>Proceed to Visit Details</span>
                    <ArrowRight className="w-4 h-4" />
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
                    <User className="w-3.5 h-3.5 text-[#0B3D2E]" />
                    Person or Office to Visit <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="personToVisit"
                    type="text"
                    required
                    value={personToVisit}
                    onChange={(e) => setPersonToVisit(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent transition-all placeholder:text-stone-400"
                    placeholder="e.g. Centre Manager, Rev. Osei, or Guest House"
                  />
                </div>

                {/* Department */}
                <div>
                  <label
                    htmlFor="department"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#152420] uppercase tracking-wider mb-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#0B3D2E]" />
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="department"
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent transition-all placeholder:text-stone-400 mb-2"
                    placeholder="Type or tap a suggestion below"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_DEPARTMENTS.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => setDepartment(dept)}
                        className={`text-[11px] py-1 px-2.5 rounded-lg border transition-all ${
                          department === dept
                            ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
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
                    <FileText className="w-3.5 h-3.5 text-[#0B3D2E]" />
                    Purpose of Visit <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="visitPurpose"
                    required
                    value={visitPurpose}
                    onChange={(e) => setVisitPurpose(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent transition-all placeholder:text-stone-400 mb-2"
                    placeholder="Briefly state the reason for your visit"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PURPOSE_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setVisitPurpose(p)}
                        className={`text-[11px] py-1 px-2.5 rounded-lg border transition-all ${
                          visitPurpose === p
                            ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
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
                    <Car className="w-3.5 h-3.5 text-[#0B3D2E]" />
                    Vehicle Registration Plate{' '}
                    <span className="text-stone-400 font-normal lowercase">(if driving)</span>
                  </label>
                  <input
                    id="vehicleRegistration"
                    type="text"
                    value={vehicleRegistration}
                    onChange={(e) => setVehicleRegistration(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-[#152420] text-sm uppercase tracking-wider font-mono focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent transition-all placeholder:normal-case placeholder:font-sans placeholder:text-stone-400"
                    placeholder="e.g. GW 4821 - 22"
                  />
                </div>

                {/* Form Navigation Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="py-3.5 px-4 rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200 font-medium text-sm transition-all flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 sm:py-4 rounded-xl text-white font-semibold text-sm sm:text-base bg-[#0B3D2E] hover:bg-[#082C21] disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Gate Pass...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Check-in</span>
                        <CheckCircle2 className="w-4 h-4" />
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
          Pentecost Convention Centre Visitor Management System · Security Gate Portal
        </p>
      </div>
    </div>
  );
}
